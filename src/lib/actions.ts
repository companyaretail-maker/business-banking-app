"use server";

import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { z } from "zod";
import {
  getCurrentAccount,
  loginUser,
  registerUser,
  destroySession,
} from "./auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ====== VALIDATION SCHEMAS ======

const depositSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Amount must be a positive number")
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 1000000;
    }, "Amount cannot exceed $1,000,000"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
});

const withdrawSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Amount must be a positive number")
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 1000000;
    }, "Amount cannot exceed $1,000,000"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ====== LEDGER: CALCULATE BALANCE ======

export async function getAccountBalance(
  accountId: string
): Promise<number> {
  const result = await db
    .select({
      balance: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        eq(transactions.status, "COMPLETED")
      )
    );
  return Number(result[0]?.balance ?? 0);
}

// ====== ACTIONS ======

export type ActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function depositAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const account = await getCurrentAccount();
  if (!account) {
    return { error: "Not authenticated" };
  }

  const parsed = depositSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const amountInCents = Math.round(parseFloat(parsed.data.amount) * 100);

  await db.insert(transactions).values({
    accountId: account.id,
    type: "DEPOSIT",
    amount: amountInCents, // positive for deposits
    status: "COMPLETED",
    description: parsed.data.description,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/deposit");
  return { success: true };
}

export async function withdrawAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const account = await getCurrentAccount();
  if (!account) {
    return { error: "Not authenticated" };
  }

  const parsed = withdrawSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const amountInCents = Math.round(parseFloat(parsed.data.amount) * 100);

  // Check balance
  const currentBalance = await getAccountBalance(account.id);
  if (amountInCents > currentBalance) {
    return { error: "Insufficient funds" };
  }

  await db.insert(transactions).values({
    accountId: account.id,
    type: "WITHDRAWAL",
    amount: -amountInCents, // negative for withdrawals
    status: "COMPLETED",
    description: parsed.data.description,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/withdraw");
  return { success: true };
}

export async function getRecentTransactions(accountId: string, limit = 10) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.accountId, accountId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getTransactionsByDateRange(
  accountId: string,
  startDate: Date,
  endDate: Date
) {
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate),
        eq(transactions.status, "COMPLETED")
      )
    )
    .orderBy(transactions.createdAt);
}

export async function getBalanceAtDate(
  accountId: string,
  date: Date
): Promise<number> {
  const result = await db
    .select({
      balance: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        eq(transactions.status, "COMPLETED"),
        lte(transactions.createdAt, date)
      )
    );
  return Number(result[0]?.balance ?? 0);
}

export async function loginAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await loginUser(parsed.data.email, parsed.data.password);
  if (result.error) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await registerUser(
    parsed.data.email,
    parsed.data.password,
    parsed.data.name
  );
  if (result.error) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
