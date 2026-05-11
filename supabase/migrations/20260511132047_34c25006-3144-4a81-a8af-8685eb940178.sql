CREATE TABLE IF NOT EXISTS public.vehicle_doc (
  user_id uuid PRIMARY KEY,
  organisme text NOT NULL DEFAULT '',
  numero text NOT NULL DEFAULT '',
  date_debut date,
  date_fin date,
  cout numeric,
  scan_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_doc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_vehicle_doc_all" ON public.vehicle_doc
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins view all vehicle_doc" ON public.vehicle_doc
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));