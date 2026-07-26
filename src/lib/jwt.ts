import * as crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

function base64urlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(str: string): Buffer {
  let padded = str + "==".substring(0, (4 - (str.length % 4)) % 4);
  return Buffer.from(
    padded.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );
}

export function createJWT(userId: string, expiresInDays = 7): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    userId,
    iat: now,
    exp: now + expiresInDays * 24 * 60 * 60,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const headerEncoded = base64urlEncode(Buffer.from(JSON.stringify(header)));
  const payloadEncoded = base64urlEncode(
    Buffer.from(JSON.stringify(payload))
  );

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest();
  const signatureEncoded = base64urlEncode(signature);

  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const now = Math.floor(Date.now() / 1000);

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${headerEncoded}.${payloadEncoded}`)
      .digest();
    const expectedSignatureEncoded = base64urlEncode(expectedSignature);

    if (signatureEncoded !== expectedSignatureEncoded) {
      return null;
    }

    // Decode payload
    const payload: JWTPayload = JSON.parse(
      base64urlDecode(payloadEncoded).toString("utf-8")
    );

    // Check expiration
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
