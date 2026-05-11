-- Insurance: cost + scan image
ALTER TABLE public.insurance
  ADD COLUMN IF NOT EXISTS cout numeric,
  ADD COLUMN IF NOT EXISTS scan_url text;

-- Vignette table (Algerian road tax)
CREATE TABLE IF NOT EXISTS public.vignette (
  user_id uuid PRIMARY KEY,
  compagnie text NOT NULL DEFAULT '',
  numero text NOT NULL DEFAULT '',
  date_debut date,
  date_fin date,
  cout numeric,
  scan_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vignette ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_vignette_all" ON public.vignette
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins view all vignette" ON public.vignette
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for scanned documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users update own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "admins read all documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));