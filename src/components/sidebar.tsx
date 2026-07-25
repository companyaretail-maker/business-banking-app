"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/deposit",
    label: "Deposit",
    icon: ArrowDownToLine,
  },
  {
    href: "/dashboard/withdraw",
    label: "Withdraw",
    icon: ArrowUpFromLine,
  },
  {
    href: "/dashboard/statements",
    label: "Statements",
    icon: FileText,
  },
];

export function Sidebar({
  userName,
  userEmail,
  accountNumber,
}: {
  userName: string;
  userEmail: string;
  accountNumber: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">VaultBank</h1>
            <p className="text-xs text-slate-400">Business Banking</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Account Info */}
      <div className="px-4 py-3 border-t border-slate-700/50">
        <div className="text-xs text-slate-400 mb-1">Account</div>
        <div className="text-sm font-mono text-slate-300">
          •••• {accountNumber.slice(-4)}
        </div>
      </div>

      {/* User / Logout */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {userName}
            </p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
