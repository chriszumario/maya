export function testAccessToken(expiresAt = 4_102_444_800) {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ exp: expiresAt })}.signature`;
}

export const testRefreshToken = "refresh-token-with-valid-length-1234567890";
