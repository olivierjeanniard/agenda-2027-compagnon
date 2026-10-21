// Fonction serverless (Vercel) : s'exécute côté serveur, jamais dans le navigateur.
// La clé API reste secrète : elle est lue depuis la variable d'environnement ANTHROPIC_API_KEY.

const SYSTEM_PROMPT = `Tu lis des rendez-vous écrits à la main (photo d'une page d'agenda ou d'une note) ou tapés (texte).
Réponds UNIQUEMENT avec un tableau JSON, sans texte autour, sans balises markdown.
Chaque élément : {"title": string, "date": "YYYY-MM-DD" ou null, "time": "HH:MM" ou null, "location": string ou null}.

Règles :
- "date" : uniquement si une date est réellement visible (par exemple l'intitulé imprimé du jour, comme "Lundi 4 janvier 2028") ou écrite à côté du rendez-vous. Si aucune date n'est visible, mets null. N'invente JAMAIS une date.
- Cet agenda couvre du 28 décembre 2026 au 31 décembre 2028. Si l'année n'est pas écrite mais que le jour de la semaine et la date (jour + mois) sont visibles, choisis l'année (2027 ou 2028) pour laquelle ce jour de la semaine correspond bien à cette date.
- Un jour de la semaine seul (par exemple "lundi") sans date précise : date = null.
- "time" : format 24 h, "HH:MM". Si un chiffre manuscrit est ambigu ou donne une heure impossible (par exemple "13h95"), choisis l'heure valide la plus plausible ("13:45"). Si aucune heure n'est indiquée, null.
- "title" : court, en français, orthographe corrigée si le mot est évident (par exemple "réunion avec Jean").
- "location" : seulement si un lieu est écrit, sinon null.
- Plusieurs rendez-vous sur la page : un élément par rendez-vous, dans l'ordre de la page.
- Ignore tout ce qui n'est pas un rendez-vous (titres imprimés, lignes vides, "Priorités", "Notes").`;

function cleanEvents(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e === "object")
    .map((e) => {
      let date = typeof e.date === "string" ? e.date.trim() : null;
      if (date) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
        let ok = false;
        if (m) {
          const y = +m[1], mo = +m[2], d = +m[3];
          const dt = new Date(Date.UTC(y, mo - 1, d));
          ok = dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d && y >= 2026 && y <= 2028;
        }
        if (!ok) date = null;
      }
      let time = typeof e.time === "string" ? e.time.trim() : null;
      if (time && /^\d:[0-5]\d$/.test(time)) time = "0" + time;
      if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) time = null;
      return {
        title: String(e.title || "").trim().slice(0, 200) || "Rendez-vous",
        date: date || null,
        time: time || null,
        location: e.location ? String(e.location).trim().slice(0, 200) : null,
      };
    })
    .slice(0, 40);
}

function parseModelJson(raw) {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) throw new Error("Réponse illisible");
  return JSON.parse(raw.slice(start, end + 1));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Le service n'est pas configuré (clé manquante)." });
  }

  const { image, imageMediaType, text } = req.body || {};
  if (!image && !text) {
    return res.status(400).json({ error: "Aucune image ni texte fourni." });
  }
  if (image && image.length > 4000000) {
    return res.status(413).json({ error: "Image trop lourde. Réessayez avec une photo plus légère." });
  }
  if (text && text.length > 5000) {
    return res.status(400).json({ error: "Texte trop long." });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const mediaType = allowedTypes.includes(imageMediaType) ? imageMediaType : "image/jpeg";

  const contentBlocks = image
    ? [
        { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
        { type: "text", text: "Extrais les rendez-vous de cette photo." },
      ]
    : [{ type: "text", text }];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: contentBlocks }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Erreur API Anthropic", response.status, errText);
      const msg =
        response.status === 401 ? "Clé API invalide ou expirée."
        : response.status === 429 ? "Service momentanément saturé, réessayez dans une minute."
        : response.status === 400 && /credit/i.test(errText) ? "Crédit insuffisant sur le compte API."
        : "Le service de lecture est indisponible pour le moment.";
      return res.status(502).json({ error: msg });
    }

    const data = await response.json();
    const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const events = cleanEvents(parseModelJson(raw));
    return res.status(200).json({ events });
  } catch (err) {
    console.error("Erreur serveur", err);
    return res.status(500).json({ error: "Lecture impossible. Réessayez avec une photo plus nette." });
  }
}
