const ALLOWED_EVENTS = new Set([
  "calculator_view",
  "calculator_started",
  "result_requested",
  "advanced_opened",
  "result_share_clicked",
  "beta_interest_clicked",
]);

function clean(value, max = 100) {
  return String(value ?? "")
    .replace(/[\r\n\t]/g, " ")
    .trim()
    .slice(0, max);
}

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false });
  }

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const event = clean(body.event, 50);

  if (!ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ ok: false });
  }

  const payload = {
    event,
    sessionId: clean(body.sessionId, 64),
    source: clean(body.source, 80) || "direct",
    medium: clean(body.medium, 80),
    campaign: clean(body.campaign, 100),
    content: clean(body.content, 100),
    path: clean(body.path, 120),
    occurredAt: new Date().toISOString(),
  };

  console.log("[NSEYER_ANALYTICS]", JSON.stringify(payload));
  return res.status(204).end();
}
