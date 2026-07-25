import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentAccount } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar userName={user.name} userEmail={user.email} accountNumber={account.accountNumber} />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
