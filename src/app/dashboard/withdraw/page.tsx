"use client";

import { useActionState, useRef, useEffect } from "react";
import { withdrawAction, type ActionResult } from "@/lib/actions";
import { ArrowUpFromLine, CheckCircle2, AlertCircle } from "lucide-react";

const initialState: ActionResult = {};

export default function WithdrawPage() {
  const [state, formAction, isPending] = useActionState(withdrawAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Withdraw Funds</h1>
        <p className="text-sm text-muted mt-1">
          Withdraw from your business checking account.
        </p>
      </div>

      <div className="max-w-lg">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Withdraw Funds</h2>
              <p className="text-xs text-muted">
                Debits will be applied immediately
              </p>
            </div>
          </div>

          {state.success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Withdrawal completed successfully!
            </div>
          )}

          {state.error && !state.fieldErrors && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {state.error}
            </div>
          )}

          <form ref={formRef} action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                  $
                </span>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000000"
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="0.00"
                />
              </div>
              {state.fieldErrors?.amount && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.amount[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Description
              </label>
              <input
                id="description"
                name="description"
                type="text"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="e.g., Vendor payment, Office supplies"
              />
              {state.fieldErrors?.description && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.description[0]}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-500 text-white font-medium py-2.5 px-4 rounded-lg transition text-sm"
            >
              {isPending ? (
                "Processing..."
              ) : (
                <>
                  <ArrowUpFromLine className="w-4 h-4" />
                  Complete Withdrawal
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
