import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccount, getCurrentUser } from "@/lib/auth";
import {
  getTransactionsByDateRange,
  getBalanceAtDate,
} from "@/lib/actions";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

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

  const openingBalance = await getBalanceAtDate(
    account.id,
    new Date(startDateStr + "T00:00:00.000Z")
  );

  const txns = await getTransactionsByDateRange(
    account.id,
    startDate,
    endDate
  );

  let runningBalance = openingBalance;
  const transactionsWithBalance = txns.map((txn) => {
    runningBalance += txn.amount;
    return { ...txn, runningBalance };
  });

  const totalDeposits = txns
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = txns
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Generate PDF
  const doc = new jsPDF();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("VaultBank", 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Business Banking Statement", 14, 28);
  doc.setFontSize(8);
  doc.text(
    `Generated: ${formatDate(new Date())}`,
    14,
    36
  );

  // Right side of header
  doc.setFontSize(9);
  doc.text(`Account: ${account.accountNumber}`, 196, 20, { align: "right" });
  doc.text(`Type: ${account.accountType.replace("_", " ")}`, 196, 27, {
    align: "right",
  });
  doc.text(`Account Holder: ${user.name}`, 196, 34, { align: "right" });

  // Statement Period
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Statement Period", 14, 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `${formatDate(startDate)} — ${formatDate(endDate)}`,
    14,
    65
  );

  // Summary box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 72, 182, 28, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Opening Balance", 24, 80);
  doc.text("Total Credits", 69, 80);
  doc.text("Total Debits", 114, 80);
  doc.text("Closing Balance", 159, 80);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(openingBalance), 24, 90);
  doc.setTextColor(22, 163, 74);
  doc.text(`+${formatCurrency(totalDeposits)}`, 69, 90);
  doc.setTextColor(220, 38, 38);
  doc.text(`-${formatCurrency(totalWithdrawals)}`, 114, 90);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(runningBalance), 159, 90);

  // Transactions table
  const tableData = transactionsWithBalance.map((txn) => [
    formatDate(txn.createdAt),
    txn.description || txn.type,
    txn.type === "WITHDRAWAL" ? formatCurrency(Math.abs(txn.amount)) : "",
    txn.type === "DEPOSIT" ? formatCurrency(txn.amount) : "",
    formatCurrency(txn.runningBalance),
  ]);

  autoTable(doc, {
    startY: 108,
    head: [["Date", "Description", "Debit", "Credit", "Balance"]],
    body: tableData.length > 0 ? tableData : [["", "No transactions found", "", "", ""]],
    headStyles: {
      fillColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: "auto" },
      2: { halign: "right", cellWidth: 30, textColor: [220, 38, 38] },
      3: { halign: "right", cellWidth: 30, textColor: [22, 163, 74] },
      4: { halign: "right", cellWidth: 30, fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    theme: "grid",
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      "This is a computer-generated statement. VaultBank — Business Banking Platform.",
      105,
      285,
      { align: "center" }
    );
    doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: "right" });
  }

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="statement_${startDateStr}_${endDateStr}.pdf"`,
    },
  });
}
