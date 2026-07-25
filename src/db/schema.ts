import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  pgEnum,
  text,
} from "drizzle-orm/pg-core";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "DEPOSIT",
  "WITHDRAWAL",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "COMPLETED",
  "PENDING",
  "FAILED",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  accountType: varchar("account_type", { length: 50 })
    .notNull()
    .default("BUSINESS_CHECKING"),
  accountNumber: varchar("account_number", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(), // stored in cents, positive for deposits, negative for withdrawals
  status: transactionStatusEnum("status").notNull().default("COMPLETED"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
