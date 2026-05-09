import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateCandidate } from "./src/evaluator.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 5173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

function readRequestBody(req, limitBytes = 4_000_000) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > limitBytes) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream"
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        service: "InterviewOS evaluator",
        mode: process.env.OPENAI_API_KEY ? "heuristic+llm-ready" : "heuristic"
      });
      return;
    }

    if (req.method === "GET" && req.url === "/api/demo-evidence") {
      const demo = await readFile(join(root, "data/demo-evidence.json"), "utf8");
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(demo);
      return;
    }

    if (req.method === "GET" && req.url === "/api/schema/evaluation-response") {
      const schema = await readFile(join(root, "docs/api/evaluation-response.schema.json"), "utf8");
      res.writeHead(200, { "content-type": "application/schema+json; charset=utf-8" });
      res.end(schema);
      return;
    }

    if (req.method === "POST" && req.url === "/api/evaluations") {
      const body = await readRequestBody(req);
      const payload = body ? JSON.parse(body) : {};
      const evaluation = await evaluateCandidate(payload);
      sendJson(res, 200, evaluation);
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, {
      error: "Evaluation failed",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, () => {
  console.log(`InterviewOS running at http://localhost:${port}`);
});
