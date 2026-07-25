import { getCurrentAccount } from "@/lib/auth";
import { getAccountBalance, getRecentTransactions } from "@/lib/actions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { redirect } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const balance = await getAccountBalance(account.id);
  const recentTxns = await getRecentTransactions(account.id, 10);

  const totalDeposits = recentTxns
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = recentTxns
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Welcome back. Here&apos;s your account overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20 col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-200" />
            <span className="text-sm font-medium text-blue-200">
              Current Balance
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {formatCurrency(balance)}
          </p>
          <p className="text-xs text-blue-200 mt-2">
            Calculated from all transactions
          </p>
        </div>

        {/* Deposits Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-muted">
              Recent Deposits
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalDeposits)}
          </p>
          <p className="text-xs text-muted mt-1">Last 10 transactions</p>
        </div>

        {/* Withdrawals Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowUpFromLine className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-sm font-medium text-muted">
              Recent Withdrawals
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalWithdrawals)}
          </p>
          <p className="text-xs text-muted mt-1">Last 10 transactions</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/dashboard/deposit"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <ArrowDownToLine className="w-4 h-4" /> Make Deposit
        </Link>
        <Link
          href="/dashboard/withdraw"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <ArrowUpFromLine className="w-4 h-4" /> Withdraw Funds
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted" />
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Transactions
          </h2>
        </div>

        {recentTxns.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted text-sm">No transactions yet.</p>
            <p className="text-muted text-xs mt-1">
              Make your first deposit to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentTxns.map((txn) => (
              <div
                key={txn.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      txn.type === "DEPOSIT"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {txn.type === "DEPOSIT" ? (
                      <ArrowDownToLine className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpFromLine className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {txn.description || txn.type}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(txn.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      txn.type === "DEPOSIT"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {txn.type === "DEPOSIT" ? "+" : ""}
                    {formatCurrency(txn.amount)}
                  </p>
                  <p className="text-xs text-muted">{txn.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
