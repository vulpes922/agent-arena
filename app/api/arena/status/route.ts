export async function GET() {
  return Response.json({
    available: false,
    reason:
      "Live Codex debates run locally on your computer. This hosted preview includes a sample debate.",
  });
}
