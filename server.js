import { createServer } from "node:http";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import worker from "./worker.js";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const dataPath = process.env.DATA_PATH || join(root, ".data", "cholobet-kv.json");
const apiRoutes = new Set([
  "/state",
  "/login",
  "/mine",
  "/save",
  "/chpass",
  "/results",
  "/actuals",
  "/kickoff",
  "/addmatch"
]);

class FileKV {
  constructor(path) {
    this.path = path;
    this.data = {};
    this.loaded = false;
    this.writeQueue = Promise.resolve();
  }

  async load() {
    if (this.loaded) return;
    try {
      this.data = JSON.parse(await readFile(this.path, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      this.data = {};
    }
    this.loaded = true;
  }

  async get(key) {
    await this.load();
    const record = this.data[key];
    if (!record) return null;
    if (record.expiresAt && record.expiresAt <= Date.now()) {
      delete this.data[key];
      await this.persist();
      return null;
    }
    return record.value;
  }

  async put(key, value, options = {}) {
    await this.load();
    const expirationTtl = Number(options.expirationTtl || 0);
    this.data[key] = {
      value: String(value),
      expiresAt: expirationTtl > 0 ? Date.now() + expirationTtl * 1000 : null
    };
    await this.persist();
  }

  async persist() {
    await mkdir(dirname(this.path), { recursive: true });
    this.writeQueue = this.writeQueue.then(async () => {
      const tmpPath = `${this.path}.tmp`;
      await writeFile(tmpPath, JSON.stringify(this.data), "utf8");
      await rename(tmpPath, this.path);
    });
    return this.writeQueue;
  }
}

const kv = new FileKV(dataPath);
const env = {
  KV: kv,
  ADMIN_PASS: process.env.ADMIN_PASS || ""
};

function contentType(path) {
  const ext = extname(path);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function staticResponse(path) {
  const file = path === "/" ? "index.html" : path.replace(/^\/+/, "");
  const fullPath = join(root, file);
  if (!fullPath.startsWith(root)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    return new Response(await readFile(fullPath), {
      headers: { "Content-Type": contentType(fullPath) }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

async function handle(request) {
  const url = new URL(request.url);
  if (url.pathname === "/healthz") {
    return new Response("ok", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (apiRoutes.has(url.pathname)) {
    return worker.fetch(request, env);
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  return staticResponse(url.pathname);
}

createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host || "localhost"}`;
    const request = new Request(new URL(req.url || "/", origin), {
      method: req.method,
      headers: req.headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
      duplex: "half"
    });
    const response = await handle(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    const body = response.body ? Buffer.from(await response.arrayBuffer()) : Buffer.alloc(0);
    res.end(body);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`CholoBet listening on ${port}`);
});
