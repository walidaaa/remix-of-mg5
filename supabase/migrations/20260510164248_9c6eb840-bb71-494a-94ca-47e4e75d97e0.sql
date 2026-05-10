
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Vehicles (one per user)
CREATE TABLE public.vehicles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  matricule TEXT NOT NULL DEFAULT '',
  marque TEXT NOT NULL DEFAULT 'MG',
  modele TEXT NOT NULL DEFAULT 'MG5',
  couleur TEXT NOT NULL DEFAULT '',
  transmission TEXT NOT NULL DEFAULT 'automatique',
  annee INT NOT NULL DEFAULT 2024,
  km_actuel INT NOT NULL DEFAULT 0,
  intervalle_vidange INT NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_vehicle_all" ON public.vehicles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Oil changes
CREATE TABLE public.oil_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  km INT NOT NULL,
  type_huile TEXT NOT NULL,
  filtre_huile TEXT,
  cout NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.oil_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_oil_all" ON public.oil_changes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_oil_user_km ON public.oil_changes(user_id, km DESC);

-- Maintenance
CREATE TABLE public.maintenance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  km INT NOT NULL,
  intervalle_km INT,
  intervalle_mois INT,
  cout NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_maint_all" ON public.maintenance_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_maint_user_date ON public.maintenance_items(user_id, date DESC);

-- Insurance (one per user)
CREATE TABLE public.insurance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  compagnie TEXT NOT NULL DEFAULT '',
  numero_police TEXT NOT NULL DEFAULT '',
  date_debut DATE,
  date_fin DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_ins_all" ON public.insurance FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_insurance_updated BEFORE UPDATE ON public.insurance FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Scans
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_scans_all" ON public.scans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_scans_user_at ON public.scans(user_id, scanned_at DESC);
