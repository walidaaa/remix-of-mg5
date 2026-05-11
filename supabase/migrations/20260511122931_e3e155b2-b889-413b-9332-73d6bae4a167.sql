-- Remove duplicate oil_changes (same user, km, type_huile, filtre_huile within 1 minute)
DELETE FROM public.oil_changes a
USING public.oil_changes b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id
  AND a.km = b.km
  AND a.type_huile = b.type_huile
  AND COALESCE(a.filtre_huile,'') = COALESCE(b.filtre_huile,'')
  AND ABS(EXTRACT(EPOCH FROM (a.created_at - b.created_at))) < 60;