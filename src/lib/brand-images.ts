import mg from "@/assets/mg5-exterior.jpg";
import volkswagen from "@/assets/brands/volkswagen.webp";
import geely from "@/assets/brands/geely.jpeg";
import jetour from "@/assets/brands/jetour.jpg";
import changan from "@/assets/brands/changan.jpg";
import chery from "@/assets/brands/chery.jpg";
import haval from "@/assets/brands/haval.jpg";
import byd from "@/assets/brands/byd.jpg";
import gac from "@/assets/brands/gac.jpg";
import omoda from "@/assets/brands/omoda.jpg";
import jaecoo from "@/assets/brands/jaecoo.jpg";

const MAP: Record<string, string> = {
  mg,
  geely,
  jetour,
  changan,
  chery,
  haval,
  byd,
  gac,
  omoda,
  jaecoo,
  volkswagen,
};

export function getBrandImage(marque?: string | null): string {
  if (!marque) return mg;
  const key = marque.toLowerCase().replace(/\s*\(.*\)\s*/g, "").trim();
  return MAP[key] ?? mg;
}
