CREATE TABLE public.car_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.car_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, name)
);

ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authed can read models"
ON public.car_models FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins manage models"
ON public.car_models FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.car_models (brand_id, name)
SELECT b.id, m.name FROM public.car_brands b
CROSS JOIN (VALUES ('MG5 Luxury'), ('MG5 Auto'), ('MG6'), ('MG7')) AS m(name)
WHERE b.name = 'MG'
ON CONFLICT DO NOTHING;