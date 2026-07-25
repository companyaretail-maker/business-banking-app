"use client";

import { useState } from "react";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";

export default function StatementsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState<{
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      description: string;
      createdAt: string;
      runningBalance: number;
    }>;
    openingBalance: number;
    closingBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    accountNumber: string;
    accountType: string;
    userName: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  const fetchPreview = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be before end date.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/statements/preview?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch statement data");
      }
      const data = await res.json();
      setPreviewData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load statement";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/statements/pdf?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate PDF");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement_${startDate}_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to download PDF";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Bank Statements</h1>
        <p className="text-sm text-muted mt-1">
          Generate and download account statements for any period.
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Select Period</h2>
            <p className="text-xs text-muted">
              Choose the date range for your statement
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={fetchPreview}
            disabled={loading || !startDate || !endDate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Generate Statement
          </button>

          {previewData && (
            <button
              onClick={downloadPdf}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-500 text-white rounded-lg text-sm font-medium transition"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Statement Preview */}
      {previewData && (
        <div className="bg-card rounded-2xl border border-border shadow-sm">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-slate-50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Account Statement
                </h2>
                <p className="text-sm text-muted">
                  {formatDate(previewData.startDate)} —{" "}
                  {formatDate(previewData.endDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Account</p>
                <p className="text-sm font-mono font-medium text-slate-900">
                  •••• {previewData.accountNumber.slice(-4)}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 border-b border-border">
            <div>
              <p className="text-xs text-muted">Opening Balance</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(previewData.openingBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Total Deposits</p>
              <p className="text-sm font-semibold text-green-600">
                +{formatCurrency(previewData.totalDeposits)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Total Withdrawals</p>
              <p className="text-sm font-semibold text-red-600">
                -{formatCurrency(previewData.totalWithdrawals)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Closing Balance</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(previewData.closingBalance)}
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          {previewData.transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted text-sm">
                No transactions found for this period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-6 py-3 font-medium text-muted">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-muted">
                      Description
                    </th>
                    <th className="text-right px-6 py-3 font-medium text-muted">
                      Debit
                    </th>
                    <th className="text-right px-6 py-3 font-medium text-muted">
                      Credit
                    </th>
                    <th className="text-right px-6 py-3 font-medium text-muted">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="border-b border-border last:border-0 hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-3 text-slate-700 whitespace-nowrap">
                        {formatDate(txn.createdAt)}
                      </td>
                      <td className="px-6 py-3 text-slate-900">
                        {txn.description}
                      </td>
                      <td className="px-6 py-3 text-right text-red-600">
                        {txn.type === "WITHDRAWAL"
                          ? formatCurrency(Math.abs(txn.amount))
                          : ""}
                      </td>
                      <td className="px-6 py-3 text-right text-green-600">
                        {txn.type === "DEPOSIT"
                          ? formatCurrency(txn.amount)
                          : ""}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(txn.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
