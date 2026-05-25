import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type DocKind = "assurance" | "vignette" | "vehicle";

const PROMPTS: Record<DocKind, string> = {
  assurance:
    "Document = police d'assurance automobile algérienne. Extrais: compagnie (nom assureur, ex: GIG, SAA, CAAR, CAAT, Trust), numero (N° police/contrat), dateDebut (date d'effet), dateFin (date d'échéance), cout (prime totale en DA, nombre uniquement).",
  vignette:
    "Document = vignette automobile algérienne. Extrais: compagnie (administration/agence émettrice si visible), numero (N° vignette/quittance), dateDebut (date de paiement/début validité), dateFin (date de fin de validité, en général 31/12 de l'année), cout (montant en DA, nombre uniquement).",
  vehicle:
    "Document = carte grise / permis / document véhicule algérien. Extrais: organisme (organisme émetteur), numero (numéro du document/immatriculation), dateDebut (date de délivrance), dateFin (date d'expiration si présente), cout (frais en DA si présent, sinon null).",
};

export const scanDocument = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string; kind: DocKind }) => ({
    imageDataUrl: z.string().min(20).max(15_000_000).parse(d.imageDataUrl),
    kind: z.enum(["assurance", "vignette", "vehicle"]).parse(d.kind),
  }))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant OCR pour documents administratifs algériens. " +
              PROMPTS[data.kind] +
              " Réponds STRICTEMENT en JSON: {\"compagnie\": string|null, \"organisme\": string|null, \"numero\": string|null, \"dateDebut\": \"YYYY-MM-DD\"|null, \"dateFin\": \"YYYY-MM-DD\"|null, \"cout\": number|null}. " +
              "Convertis toutes les dates au format YYYY-MM-DD (les dates affichées sont souvent DD/MM/YYYY). Pas de markdown, pas de prose.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrais les données de ce document." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Trop de requêtes, réessayez dans un instant");
      if (res.status === 402) throw new Error("Crédits IA épuisés");
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    let parsed: any = {};
    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : cleaned);
    } catch {
      parsed = {};
    }

    const normDate = (v: any): string | null => {
      if (!v || typeof v !== "string") return null;
      const s = v.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
      if (m) {
        let [, d, mo, y] = m;
        if (y.length === 2) y = "20" + y;
        return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      return null;
    };

    return {
      compagnie: typeof parsed.compagnie === "string" ? parsed.compagnie : null,
      organisme: typeof parsed.organisme === "string" ? parsed.organisme : null,
      numero: typeof parsed.numero === "string" ? parsed.numero : null,
      dateDebut: normDate(parsed.dateDebut),
      dateFin: normDate(parsed.dateFin),
      cout: typeof parsed.cout === "number" && isFinite(parsed.cout) ? parsed.cout : null,
    };
  });
