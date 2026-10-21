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

createServer((request, response) => {
  const { pathname } = new URL(request.url, "http://127.0.0.1:4012");
  response.setHeader("Content-Type", "application/json");
  if (pathname === "/health") return response.end(JSON.stringify({ ok: true }));
  if (pathname === "/api/auth/login" && request.method === "POST") {
    return response.end(
      JSON.stringify({
        accessToken: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600 })}.test-signature`,
        refreshToken: "e2e-refresh-token-for-isolated-browser-tests",
        user,
      }),
    );
  }
  if (!request.headers.authorization && pathname !== "/api/auth/logout") {
    response.statusCode = 401;
    return response.end(
      JSON.stringify({
        error: { code: "UNAUTHENTICATED", message: "Unauthorized" },
      }),
    );
  }
  if (pathname === "/api/auth/logout") {
    response.statusCode = 204;
    return response.end();
  }
  if (pathname === "/api/today/tasks") {
    return response.end(
      JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        tasks: [],
      }),
    );
  }
  if (["/api/goals", "/api/nutrition", "/api/journal"].includes(pathname)) {
    return response.end(JSON.stringify({ items: [], nextCursor: null }));
  }
  response.statusCode = 503;
  response.end(
    JSON.stringify({
      error: { code: "UNAVAILABLE", message: "Test service unavailable" },
    }),
  );
}).listen(4012, "127.0.0.1");
