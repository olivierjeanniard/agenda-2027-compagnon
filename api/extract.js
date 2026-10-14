// Fonction serverless (Vercel) — s'exécute côté serveur, jamais dans le navigateur.
// La clé API reste secrète : elle est lue depuis une variable d'environnement.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Clé API non configurée sur le serveur." });
  }

  const { image, imageMediaType, text } = req.body || {};

  if (!image && !text) {
    return res.status(400).json({ error: "Aucune image ni texte fourni." });
  }

  const systemPrompt = `Tu extrais des rendez-vous à partir d'une image ou d'un texte manuscrit/tapé. Réponds UNIQUEMENT avec un tableau JSON, sans texte autour, sans balises markdown. Chaque élément : {"title": string, "date": "YYYY-MM-DD", "time": "HH:MM" ou null si pas d'heure précisée, "location": string ou null}. Si l'année n'est pas mentionnée, utilise l'année en cours ou la suivante selon le contexte (cet agenda concerne 2027). Si seul un jour de la semaine est donné, choisis la prochaine occurrence plausible. Ignore tout ce qui n'est pas un rendez-vous.`;

  const contentBlocks = image
    ? [
        { type: "image", source: { type: "base64", media_type: imageMediaType, data: image } },
        { type: "text", text: "Extrais les rendez-vous de cette photo." },
      ]
    : [{ type: "text", text: text }];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        // Modèle rapide et economique, largement suffisant pour cette tache d'extraction.
        model: "claude-haiku-5-5",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: contentBlocks }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Erreur API Anthropic", details: errText });
    }

    const data = await response.json();
    const textBlocks = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const clean = textBlocks.replace(/```json|```/g, "").trim();
    const events = JSON.parse(clean);

    return res.status(200).json({ events });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur", details: String(err) });
  }
}
