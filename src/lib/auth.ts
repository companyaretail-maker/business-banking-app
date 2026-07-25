import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { generateAccountNumber } from "./utils";

const SESSION_COOKIE = "banking_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  // Simple session: store userId in a cookie (in production, use signed JWT/session tokens)
  const sessionToken = Buffer.from(
    JSON.stringify({ userId, ts: Date.now() })
  ).toString("base64");
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (decoded.userId) return { userId: decoded.userId };
    return null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  return result[0] || null;
}

export async function getCurrentAccount() {
  const user = await getCurrentUser();
  if (!user) return null;
  const result = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, user.id))
    .limit(1);
  return result[0] || null;
}

export async function registerUser(
  email: string,
  password: string,
  name: string
) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Email already registered" };
  }

  const hashedPassword = await hashPassword(password);
  const newUsers = await db
    .insert(users)
    .values({ email, password: hashedPassword, name })
    .returning();
  const user = newUsers[0];

  // Create a default business checking account
  await db.insert(accounts).values({
    userId: user.id,
    accountType: "BUSINESS_CHECKING",
    accountNumber: generateAccountNumber(),
  });

  await createSession(user.id);
  return { success: true };
}

export async function loginUser(email: string, password: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (result.length === 0) {
    return { error: "Invalid email or password" };
  }
  const user = result[0];
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { error: "Invalid email or password" };
  }
  await createSession(user.id);
  return { success: true };
}
