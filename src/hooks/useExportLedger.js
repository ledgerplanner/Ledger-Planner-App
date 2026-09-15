import { useCallback } from "react";

export function useExportLedger({
  bills = [],
  transactions = [],
  accounts = [],
  isDemoMode = false,
  isOnline = true,
  triggerHaptic,
  triggerVictory,
  openGlobalAction,
  triggerOfflineLock
}) {
  const handleExportData = useCallback((targetYear) => {
    if (!isOnline && !isDemoMode) {
      if (triggerOfflineLock) triggerOfflineLock();
      return;
    }

    if (triggerHaptic) triggerHaptic(50);

    try {
      const yearStr = targetYear.toString();
      let csvContent = "Type,Name,Amount,Category,Date,Status/Account\n";

      bills.forEach((b) => {
        if (b.rawDate && b.rawDate.startsWith(yearStr)) {
          const amount = b.amount || 0;
          const status = b.isPaid ? "Paid" : "Pending";
          const safeName = (b.name || "Unnamed").replace(/,/g, " ");
          const safeCategory = (b.category || "N/A").replace(/,/g, " ");
          csvContent += `Bill,${safeName},${amount},${safeCategory},${b.rawDate},${status}\n`;
        }
      });

      transactions.forEach((t) => {
        let tYear = new Date().getFullYear();
        if (t.createdAt && t.createdAt.toDate) {
          tYear = t.createdAt.toDate().getFullYear();
        }

        if (tYear === targetYear || isDemoMode) {
          const amount = t.amount || 0;
          const accName = accounts.find((a) => a.id === t.accountId)?.name || "Unknown Account";
          const safeName = (t.name || "Unnamed").replace(/,/g, " ");
          const safeCategory = (t.category || "N/A").replace(/,/g, " ");
          const safeDate = (t.date || "N/A").replace(/,/g, " ");
          const safeAcc = accName.replace(/,/g, " ");
          csvContent += `Transaction (${t.type}),${safeName},${amount},${safeCategory},${safeDate},${safeAcc}\n`;
        }
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `LP_Financial_Vault_${targetYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (triggerVictory) triggerVictory();
      if (openGlobalAction) {
        openGlobalAction(
          "Export Complete",
          `Your ${targetYear} historical master ledger has been successfully compiled and downloaded.`,
          "Close",
          false,
          () => {},
          true
        );
      }
    } catch (error) {
      console.error("Export Engine failed:", error);
    }
  }, [bills, transactions, accounts, isDemoMode, isOnline, triggerHaptic, triggerVictory, openGlobalAction, triggerOfflineLock]);

  return { handleExportData };
}
