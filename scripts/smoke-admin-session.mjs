import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const secret = "test-secret";

function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sign(payloadPart) {
  return b64url(createHmac("sha256", secret).update(payloadPart).digest());
}

function createToken() {
  const payload = b64url(
    JSON.stringify({
      v: 1,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 100,
      sid: b64url(randomBytes(16)),
    }),
  );
  return `${payload}.${sign(payload)}`;
}

function verify(value) {
  if (!value || value === "authenticated") return false;
  const [payloadPart, signature] = value.split(".");
  if (!payloadPart || !signature) return false;
  const expected = sign(payloadPart);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return true;
}

const token = createToken();
console.log(
  JSON.stringify({
    valid: verify(token),
    staticRejected: !verify("authenticated"),
    tamperedRejected: !verify(`${token}x`),
  }),
);
