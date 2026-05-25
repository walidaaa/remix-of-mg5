import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type DocKind = "assurance" | "vignette" | "vehicle";

const PROMPTS: Record<DocKind, string> = {
  assurance:
    "Document = attestation/police d'assurance automobile algérienne. " +
    "compagnie = nom de l'assureur (GIG, SAA, CAAR, CAAT, CASH, Trust, Alliance, 2A, MAATEC...). " +
    "numero = N° de police OU N° de contrat OU N° d'attestation (code alphanumérique, souvent en haut). " +
    "dateDebut = 'date d'effet' / 'du' / 'valable du' / 'début de validité'. " +
    "dateFin = 'date d'échéance' / 'au' / 'valable jusqu'au' / 'fin de validité' / 'expire le' — CHERCHE ATTENTIVEMENT, c'est souvent juste à côté de la date de début (format JJ/MM/AAAA). " +
    "cout = prime totale TTC en DA (nombre).",
  vignette:
    "Document = vignette automobile / quittance fiscale algérienne. " +
    "compagnie = administration ou recette émettrice. " +
    "numero = N° vignette OU N° quittance OU N° série. " +
    "dateDebut = date de paiement / d'émission. " +
    "dateFin = date de fin de validité (souvent 31/12 de l'année). " +
    "cout = montant payé en DA.",
  vehicle:
    "Document = carte grise / permis / immatriculation algérien. " +
    "organisme = wilaya/daïra/organisme émetteur. " +
    "numero = N° immatriculation OU N° carte grise. " +
    "dateDebut = date de délivrance / 1ère mise en circulation. " +
    "dateFin = date d'expiration si présente. " +
    "cout = frais en DA si présent.",
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
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "Tu es un OCR expert pour documents administratifs algériens (français/arabe). " +
              "Lis attentivement TOUT le document — tampons, en-têtes, tableaux, petites mentions. " +
              PROMPTS[data.kind] +
              " Si une information n'est PAS visible, mets null. NE devine PAS. " +
              "Pour les dates: convertis JJ/MM/AAAA en YYYY-MM-DD. " +
              "IMPORTANT: la dateFin est presque toujours présente sur ces documents — cherche-la activement (mentions 'au', 'jusqu'au', 'échéance', 'expire', 'fin de validité').",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrais les données via l'outil extract_doc_fields." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_doc_fields",
              description: "Retourne les champs extraits du document.",
              parameters: {
                type: "object",
                properties: {
                  compagnie: { type: ["string", "null"], description: "Nom de la compagnie d'assurance ou administration" },
                  organisme: { type: ["string", "null"], description: "Organisme émetteur (pour carte grise)" },
                  numero: { type: ["string", "null"], description: "Numéro de police/contrat/document/immatriculation" },
                  dateDebut: { type: ["string", "null"], description: "Date de début au format YYYY-MM-DD" },
                  dateFin: { type: ["string", "null"], description: "Date de fin/échéance au format YYYY-MM-DD" },
                  cout: { type: ["number", "null"], description: "Montant en DA (nombre uniquement)" },
                },
                required: ["compagnie", "organisme", "numero", "dateDebut", "dateFin", "cout"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_doc_fields" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Trop de requêtes, réessayez dans un instant");
      if (res.status === 402) throw new Error("Crédits IA épuisés");
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const msg = json?.choices?.[0]?.message;
    const toolArgs = msg?.tool_calls?.[0]?.function?.arguments;
    let parsed: any = {};
    try {
      if (toolArgs) {
        parsed = typeof toolArgs === "string" ? JSON.parse(toolArgs) : toolArgs;
      } else {
        const content: string = msg?.content ?? "";
        const cleaned = content.replace(/```json|```/g, "").trim();
        const m = cleaned.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(m ? m[0] : cleaned);
      }
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
