import {
  codexStatus,
  generateWithCodex,
  stopCodexRuns,
} from "../codex-provider.mjs";
export function arenaLocal() {
  return {
    name: "arena-local-codex",
    apply: "serve",
    configureServer(server) {
      server.httpServer?.on("close", stopCodexRuns);
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/arena/")) return next();
        const host = req.headers.host || "";
        if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
          res.writeHead(403);
          res.end("Local access only");
          return;
        }
        const json = (code, data) => {
          if (!res.destroyed) {
            res.writeHead(code, {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            });
            res.end(JSON.stringify(data));
          }
        };
        if (req.url === "/api/arena/status" && req.method === "GET") {
          json(200, await codexStatus());
          return;
        }
        if (req.url !== "/api/arena/generate" || req.method !== "POST") {
          json(404, { error: "Not found" });
          return;
        }
        if (
          req.headers.origin !== `http://${host}` ||
          !req.headers["content-type"]?.startsWith("application/json")
        ) {
          json(403, {
            error: "Only same-origin application requests are allowed.",
          });
          return;
        }
        let data = "",
          tooLarge = false;
        const controller = new AbortController();
        res.on("close", () => {
          if (!res.writableEnded) controller.abort();
        });
        req.on("data", (chunk) => {
          data += chunk;
          if (Buffer.byteLength(data) > 90000) {
            tooLarge = true;
            json(413, {
              error: "This debate is too large. Start a new arena.",
            });
            req.destroy();
          }
        });
        req.on("end", async () => {
          if (tooLarge) return;
          try {
            const body = JSON.parse(data);
            json(200, {
              result: await generateWithCodex(body, controller.signal),
            });
          } catch (error) {
            json(400, {
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to complete this round.",
            });
          }
        });
      });
    },
  };
}
