import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccount, getCurrentUser } from "@/lib/auth";
import {
  getTransactionsByDateRange,
  getBalanceAtDate,
} from "@/lib/actions";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const account = await getCurrentAccount();
  if (!user || !account) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  if (!startDateStr || !endDateStr) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const startDate = new Date(startDateStr + "T00:00:00.000Z");
  const endDate = new Date(endDateStr + "T23:59:59.999Z");

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid date format" },
      { status: 400 }
    );
  }

  // Opening balance = sum of all transactions before startDate
  const openingBalance = await getBalanceAtDate(
    account.id,
    new Date(startDateStr + "T00:00:00.000Z")
  );

  // Get transactions in range
  const txns = await getTransactionsByDateRange(
    account.id,
    startDate,
    endDate
  );

  // Calculate running balances
  let runningBalance = openingBalance;
  const transactionsWithBalance = txns.map((txn) => {
    runningBalance += txn.amount;
    return {
      id: txn.id,
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      createdAt: txn.createdAt.toISOString(),
      runningBalance,
    };
  });

  const totalDeposits = txns
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = txns
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return NextResponse.json({
    transactions: transactionsWithBalance,
    openingBalance,
    closingBalance: runningBalance,
    totalDeposits,
    totalWithdrawals,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    userName: user.name,
    startDate: startDateStr,
    endDate: endDateStr,
  });
}
