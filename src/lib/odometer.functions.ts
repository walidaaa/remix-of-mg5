import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Use Lovable AI Gateway (Gemini vision) to extract the odometer reading from an image.
export const scanOdometer = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string }) => ({
    imageDataUrl: z.string().min(20).max(15_000_000).parse(d.imageDataUrl),
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
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You are an OCR assistant specialised in reading car odometers (compteur kilométrique). " +
              "Extract ONLY the total kilometre/mile reading shown on the dashboard. " +
              "Reply STRICTLY as JSON: {\"km\": <integer or null>, \"confidence\": <0..1>, \"raw\": \"<text seen>\"}. " +
              "If unsure or unreadable, set km to null. No prose, no markdown.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Read the odometer total kilometres from this dashboard photo." },
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
    let parsed: { km: number | null; confidence?: number; raw?: string } = { km: null };
    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : cleaned);
    } catch {
      const numMatch = content.match(/\d[\d\s.,]{2,}/);
      if (numMatch) {
        const n = parseInt(numMatch[0].replace(/[^\d]/g, ""), 10);
        if (!isNaN(n)) parsed = { km: n, confidence: 0.4, raw: content };
      }
    }
    return {
      km: typeof parsed.km === "number" && isFinite(parsed.km) ? Math.round(parsed.km) : null,
      confidence: parsed.confidence ?? null,
      raw: parsed.raw ?? content?.slice(0, 200) ?? "",
    };
  });
