export async function GET() {
  return Response.json({
    available: false,
    edition: "online",
    code: "approval_required",
    reason:
      "Hosted ChatGPT plan access is awaiting approval. Explore the authored sample or run the local edition with your own account.",
  });
}
