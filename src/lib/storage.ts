export type Transmission = "automatique" | "manuelle";

export type Vehicle = {
  matricule: string;
  marque: string;
  modele: string;
  couleur: string;
  transmission: Transmission;
  annee: number;
  kmActuel: number;
  intervalleVidange: number; // km entre vidanges
};

export type OilChange = {
  id: string;
  date: string; // ISO
  km: number;
  typeHuile: string;
  filtreHuile: string;
  cout?: number;
  notes?: string;
};

export type Insurance = {
  compagnie: string;
  numeroPolice: string;
  dateDebut: string;
  dateFin: string;
};

export type MaintenanceType =
  | "filtre-air"
  | "filtre-carburant"
  | "filtre-habitacle"
  | "plaquettes-frein"
  | "disques-frein"
  | "pneus"
  | "batterie"
  | "bougies"
  | "courroie"
  | "liquide-frein"
  | "liquide-refroidissement"
  | "visite-technique"
  | "autre";

export type MaintenanceItem = {
  id: string;
  type: MaintenanceType;
  date: string;
  km: number;
  intervalleKm?: number;
  intervalleMois?: number;
  cout?: number;
  notes?: string;
};

export const MAINTENANCE_LABELS: Record<MaintenanceType, { label: string; defaultKm: number; defaultMois?: number }> = {
  "filtre-air": { label: "Filtre à air", defaultKm: 20000 },
  "filtre-carburant": { label: "Filtre à carburant", defaultKm: 40000 },
  "filtre-habitacle": { label: "Filtre habitacle", defaultKm: 15000 },
  "plaquettes-frein": { label: "Plaquettes de frein", defaultKm: 30000 },
  "disques-frein": { label: "Disques de frein", defaultKm: 60000 },
  "pneus": { label: "Pneus", defaultKm: 40000 },
  "batterie": { label: "Batterie", defaultKm: 0, defaultMois: 48 },
  "bougies": { label: "Bougies d'allumage", defaultKm: 40000 },
  "courroie": { label: "Courroie de distribution", defaultKm: 90000 },
  "liquide-frein": { label: "Liquide de frein", defaultKm: 0, defaultMois: 24 },
  "liquide-refroidissement": { label: "Liquide refroidissement", defaultKm: 60000 },
  "visite-technique": { label: "Visite technique", defaultKm: 0, defaultMois: 12 },
  "autre": { label: "Autre", defaultKm: 10000 },
};

export type AppData = {
  vehicle: Vehicle | null;
  oilChanges: OilChange[];
  insurance: Insurance | null;
  maintenance: MaintenanceItem[];
};

const STORAGE_KEY = "mg5-maintenance-v1";

const empty: AppData = { vehicle: null, oilChanges: [], insurance: null, maintenance: [] };

export function addMaintenance(m: Omit<MaintenanceItem, "id">) {
  const d = loadData();
  const item: MaintenanceItem = { ...m, id: crypto.randomUUID() };
  const vehicle = d.vehicle ? { ...d.vehicle, kmActuel: Math.max(d.vehicle.kmActuel, m.km) } : null;
  saveData({ ...d, vehicle, maintenance: [item, ...d.maintenance].sort((a, b) => +new Date(b.date) - +new Date(a.date)) });
}

export function deleteMaintenance(id: string) {
  const d = loadData();
  saveData({ ...d, maintenance: d.maintenance.filter((m) => m.id !== id) });
}

export function getMaintenanceStatus(item: MaintenanceItem, vehicle: Vehicle | null) {
  if (!vehicle) return { alerte: "ok" as const, kmRestants: null as number | null, joursRestants: null as number | null };
  let kmRestants: number | null = null;
  let joursRestants: number | null = null;
  if (item.intervalleKm && item.intervalleKm > 0) {
    kmRestants = (item.km + item.intervalleKm) - vehicle.kmActuel;
  }
  if (item.intervalleMois && item.intervalleMois > 0) {
    const fin = new Date(item.date);
    fin.setMonth(fin.getMonth() + item.intervalleMois);
    joursRestants = Math.ceil((fin.getTime() - Date.now()) / 86400000);
  }
  const km = kmRestants ?? Infinity;
  const j = joursRestants ?? Infinity;
  let alerte: "ok" | "bientot" | "urgent" | "depasse" = "ok";
  if (km <= 0 || j <= 0) alerte = "depasse";
  else if (km <= 500 || j <= 15) alerte = "urgent";
  else if (km <= 1500 || j <= 45) alerte = "bientot";
  return { alerte, kmRestants, joursRestants };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("mg5-data-update"));
}

export function updateVehicle(v: Vehicle) {
  const d = loadData();
  saveData({ ...d, vehicle: v });
}

export function addOilChange(o: Omit<OilChange, "id">) {
  const d = loadData();
  const change: OilChange = { ...o, id: crypto.randomUUID() };
  const next = [change, ...d.oilChanges].sort((a, b) => b.km - a.km);
  // mise à jour km véhicule si plus récent
  const vehicle = d.vehicle
    ? { ...d.vehicle, kmActuel: Math.max(d.vehicle.kmActuel, o.km) }
    : null;
  saveData({ ...d, vehicle, oilChanges: next });
}

export function deleteOilChange(id: string) {
  const d = loadData();
  saveData({ ...d, oilChanges: d.oilChanges.filter((o) => o.id !== id) });
}

export function updateKm(km: number) {
  const d = loadData();
  if (!d.vehicle) return;
  saveData({ ...d, vehicle: { ...d.vehicle, kmActuel: km } });
}

export function updateInsurance(i: Insurance) {
  const d = loadData();
  saveData({ ...d, insurance: i });
}

export function getNextOilChange(d: AppData): {
  prochainKm: number | null;
  kmRestants: number | null;
  alerte: "ok" | "bientot" | "urgent" | "depasse" | "aucun";
} {
  if (!d.vehicle) return { prochainKm: null, kmRestants: null, alerte: "aucun" };
  const dern = d.oilChanges[0];
  const base = dern ? dern.km : 0;
  const prochainKm = base + d.vehicle.intervalleVidange;
  const kmRestants = prochainKm - d.vehicle.kmActuel;
  let alerte: "ok" | "bientot" | "urgent" | "depasse";
  if (kmRestants <= 0) alerte = "depasse";
  else if (kmRestants <= 500) alerte = "urgent";
  else if (kmRestants <= 1500) alerte = "bientot";
  else alerte = "ok";
  return { prochainKm, kmRestants, alerte };
}
