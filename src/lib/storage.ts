import { supabase } from "@/integrations/supabase/client";

export type Transmission = "automatique" | "manuelle";

export type Vehicle = {
  matricule: string;
  marque: string;
  modele: string;
  couleur: string;
  transmission: Transmission;
  annee: number;
  kmActuel: number;
  intervalleVidange: number;
};

export type OilChange = {
  id: string;
  date: string;
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
  cout?: number;
  scanUrl?: string;
};

export type Vignette = {
  compagnie: string;
  numero: string;
  dateDebut: string;
  dateFin: string;
  cout?: number;
  scanUrl?: string;
};

export type VehicleDoc = {
  organisme: string;
  numero: string;
  dateDebut: string;
  dateFin: string;
  cout?: number;
  scanUrl?: string;
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
  vignette: Vignette | null;
  vehicleDoc: VehicleDoc | null;
  maintenance: MaintenanceItem[];
};

export const emptyData: AppData = { vehicle: null, oilChanges: [], insurance: null, vignette: null, vehicleDoc: null, maintenance: [] };

const REFRESH_EVENT = "mg5-data-update";
function ping() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REFRESH_EVENT));
}
export const DATA_EVENT = REFRESH_EVENT;

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function fetchAppData(): Promise<AppData> {
  const userId = await uid();
  if (!userId) return emptyData;

  const [veh, oils, ins, maint, vig, vdoc] = await Promise.all([
    supabase.from("vehicles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("oil_changes").select("*").eq("user_id", userId).order("km", { ascending: false }),
    supabase.from("insurance").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("maintenance_items").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("vignette").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("vehicle_doc" as any).select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const vehicle: Vehicle | null = veh.data
    ? {
        matricule: veh.data.matricule,
        marque: veh.data.marque,
        modele: veh.data.modele,
        couleur: veh.data.couleur,
        transmission: veh.data.transmission as Transmission,
        annee: veh.data.annee,
        kmActuel: veh.data.km_actuel,
        intervalleVidange: veh.data.intervalle_vidange,
      }
    : null;

  const oilChanges: OilChange[] = (oils.data ?? []).map((o) => ({
    id: o.id,
    date: o.date,
    km: o.km,
    typeHuile: o.type_huile,
    filtreHuile: o.filtre_huile ?? "",
    cout: o.cout != null ? Number(o.cout) : undefined,
    notes: o.notes ?? undefined,
  }));

  const insurance: Insurance | null = ins.data
    ? {
        compagnie: ins.data.compagnie,
        numeroPolice: ins.data.numero_police,
        dateDebut: ins.data.date_debut ?? "",
        dateFin: ins.data.date_fin ?? "",
        cout: (ins.data as any).cout != null ? Number((ins.data as any).cout) : undefined,
        scanUrl: (ins.data as any).scan_url ?? undefined,
      }
    : null;

  const vignette: Vignette | null = vig.data
    ? {
        compagnie: (vig.data as any).compagnie ?? "",
        numero: (vig.data as any).numero ?? "",
        dateDebut: (vig.data as any).date_debut ?? "",
        dateFin: (vig.data as any).date_fin ?? "",
        cout: (vig.data as any).cout != null ? Number((vig.data as any).cout) : undefined,
        scanUrl: (vig.data as any).scan_url ?? undefined,
      }
    : null;

  const maintenance: MaintenanceItem[] = (maint.data ?? []).map((m) => ({
    id: m.id,
    type: m.type as MaintenanceType,
    date: m.date,
    km: m.km,
    intervalleKm: m.intervalle_km ?? undefined,
    intervalleMois: m.intervalle_mois ?? undefined,
    cout: m.cout != null ? Number(m.cout) : undefined,
    notes: m.notes ?? undefined,
  }));

  return { vehicle, oilChanges, insurance, vignette, maintenance };
}

export async function updateVehicle(v: Vehicle) {
  const userId = await uid();
  if (!userId) return;
  await supabase.from("vehicles").upsert({
    user_id: userId,
    matricule: v.matricule,
    marque: v.marque,
    modele: v.modele,
    couleur: v.couleur,
    transmission: v.transmission,
    annee: v.annee,
    km_actuel: v.kmActuel,
    intervalle_vidange: v.intervalleVidange,
  });
  ping();
}

export async function updateKm(km: number) {
  const userId = await uid();
  if (!userId) return;
  await supabase.from("vehicles").update({ km_actuel: km }).eq("user_id", userId);
  ping();
}

async function bumpKm(km: number) {
  const userId = await uid();
  if (!userId) return;
  const { data } = await supabase.from("vehicles").select("km_actuel").eq("user_id", userId).maybeSingle();
  if (data && km > data.km_actuel) {
    await supabase.from("vehicles").update({ km_actuel: km }).eq("user_id", userId);
  }
}

export async function addOilChange(o: Omit<OilChange, "id">) {
  const userId = await uid();
  if (!userId) return;
  await supabase.from("oil_changes").insert({
    user_id: userId,
    date: o.date,
    km: o.km,
    type_huile: o.typeHuile,
    filtre_huile: o.filtreHuile || null,
    cout: o.cout ?? null,
    notes: o.notes ?? null,
  });
  await bumpKm(o.km);
  ping();
}

export async function deleteOilChange(id: string) {
  await supabase.from("oil_changes").delete().eq("id", id);
  ping();
}

export async function addMaintenance(m: Omit<MaintenanceItem, "id">) {
  const userId = await uid();
  if (!userId) return;
  await supabase.from("maintenance_items").insert({
    user_id: userId,
    type: m.type,
    date: m.date,
    km: m.km,
    intervalle_km: m.intervalleKm ?? null,
    intervalle_mois: m.intervalleMois ?? null,
    cout: m.cout ?? null,
    notes: m.notes ?? null,
  });
  await bumpKm(m.km);
  ping();
}

export async function deleteMaintenance(id: string) {
  await supabase.from("maintenance_items").delete().eq("id", id);
  ping();
}

export async function updateInsurance(i: Insurance) {
  const userId = await uid();
  if (!userId) return;
  await supabase.from("insurance").upsert({
    user_id: userId,
    compagnie: i.compagnie,
    numero_police: i.numeroPolice,
    date_debut: i.dateDebut || null,
    date_fin: i.dateFin || null,
    cout: i.cout ?? null,
    scan_url: i.scanUrl ?? null,
  } as any);
  ping();
}

export async function updateVignette(v: Vignette) {
  const userId = await uid();
  if (!userId) return;
  await supabase.from("vignette" as any).upsert({
    user_id: userId,
    compagnie: v.compagnie,
    numero: v.numero,
    date_debut: v.dateDebut || null,
    date_fin: v.dateFin || null,
    cout: v.cout ?? null,
    scan_url: v.scanUrl ?? null,
  } as any);
  ping();
}

export async function uploadDocument(kind: "assurance" | "vignette", file: File): Promise<string | null> {
  const userId = await uid();
  if (!userId) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) return null;
  return path;
}

export async function getDocumentUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export type Scan = { id: string; value: string; at: string };

export async function addScan(value: string): Promise<Scan | null> {
  const userId = await uid();
  if (!userId) return null;
  const { data } = await supabase
    .from("scans")
    .insert({ user_id: userId, value })
    .select()
    .single();
  if (!data) return null;
  return { id: data.id, value: data.value, at: data.scanned_at };
}

export async function fetchScans(limit = 30): Promise<Scan[]> {
  const userId = await uid();
  if (!userId) return [];
  const { data } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", userId)
    .order("scanned_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((s) => ({ id: s.id, value: s.value, at: s.scanned_at }));
}

export async function deleteScan(id: string) {
  await supabase.from("scans").delete().eq("id", id);
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
