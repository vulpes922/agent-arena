// Never fall back to a developer account. Replace this gate only after the
// hosted plan-use integration is approved, implemented, and verified per user.
export async function POST() {
  return Response.json(
    {
      code: "approval_required",
      error: "Hosted ChatGPT plan access is awaiting approval. Live debates are available in the local edition.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
