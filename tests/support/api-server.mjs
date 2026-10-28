import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const user = {
  id: 1,
  name: "Usuario de prueba",
  email: "e2e@example.com",
  isAdmin: false,
  timezone: "UTC",
};

const sessions = new Map();

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, "http://127.0.0.1:4012");
  response.setHeader("Content-Type", "application/json");
  if (pathname === "/health") return response.end(JSON.stringify({ ok: true }));
  if (pathname === "/auth/login" && request.method === "POST") {
    const accessToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600, sid: randomUUID() })}.test-signature`;
    sessions.set(`Bearer ${accessToken}`, { nutrition: [], nextId: 1 });
    return response.end(
      JSON.stringify({
        accessToken,
        refreshToken: "e2e-refresh-token-for-isolated-browser-tests",
        user,
      }),
    );
  }
  if (!request.headers.authorization && pathname !== "/auth/logout") {
    response.statusCode = 401;
    return response.end(
      JSON.stringify({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" },
      }),
    );
  }
  if (pathname === "/auth/logout") {
    return response.end(JSON.stringify({ status: "logged_out" }));
  }
  if (pathname === "/auth/me") return response.end(JSON.stringify(user));
  if (/^\/goals\/\d+(\/tasks)?$/.test(pathname)) {
    response.statusCode = 404;
    return response.end(
      JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found" } }),
    );
  }
  const session = sessions.get(request.headers.authorization);
  if (
    session &&
    (pathname === "/nutrition" || /^\/nutrition\/\d+$/.test(pathname))
  ) {
    const id = Number(pathname.split("/")[2]);
    if (request.method === "GET") {
      return response.end(
        JSON.stringify({ items: session.nutrition, nextCursor: null }),
      );
    }
    if (request.method === "DELETE") {
      session.nutrition = session.nutrition.filter((entry) => entry.id !== id);
      return response.end(JSON.stringify({ id }));
    }
    let body = "";
    for await (const chunk of request) body += chunk;
    const input = JSON.parse(body);
    if (request.method === "POST") {
      const entry = {
        ...input,
        id: session.nextId++,
        userId: user.id,
        localDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      session.nutrition.push(entry);
      return response.end(JSON.stringify(entry));
    }
    const entry = session.nutrition.find((entry) => entry.id === id);
    Object.assign(entry, input);
    return response.end(JSON.stringify(entry));
  }
  if (pathname === "/today/tasks") {
    return response.end(
      JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        tasks: [],
      }),
    );
  }
  if (["/goals", "/nutrition", "/journal"].includes(pathname)) {
    return response.end(JSON.stringify({ items: [], nextCursor: null }));
  }
  response.statusCode = 503;
  response.end(
    JSON.stringify({
      error: { code: "UNAVAILABLE", message: "Test service unavailable" },
    }),
  );
}).listen(4012, "127.0.0.1");
