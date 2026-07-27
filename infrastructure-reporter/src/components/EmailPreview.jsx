import React from "react";

const EmailPreview = ({ report }) => {
  const generateEmail = () => {
    const reportLines = [
      `Weekly Infrastructure Report – ${report.date}`,
      "",
      "● New environment created:",
      ...(report.newEnvironments.length > 0
        ? report.newEnvironments.map((e) => `  – ${e}`)
        : ["  – None"]),
      "",
      "● Upgrades/additional services provisioned:",
      ...(report.upgrades.length > 0
        ? report.upgrades.map((u) => `  – ${u}`)
        : ["  – None"]),
      "",
      "● Estimated monthly cost change:",
      `  – Previous week estimate: $${report.totals.lastWeek.toFixed(2)}`,
      `  – Current week estimate:  $${report.totals.current.toFixed(2)}`,
      `  – Net change:             $${report.totals.change.toFixed(2)} (${report.totals.changePercent >= 0 ? "+" : ""}${report.totals.changePercent.toFixed(1)}%)`,
      "",
      "─── Cost Breakdown ──────────────────────────",
      "",
    ];

    const grouped = report.services.reduce((acc, service) => {
      if (!acc[service.system]) acc[service.system] = [];
      acc[service.system].push(service);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([system, services]) => {
      const currency = services[(0)?.currency] || "$";
      reportLines.push(`${system}:`);
      services.forEach((s) => {
        const diff = s.currentCost - s.lastWeekCost;
        const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "↔";
        reportLines.push(
          `  – ${s.name}: ${currency}${s.currentCost.toFixed(2)} (${arrow} ${currency}${Math.abs(diff).toFixed(2)})`,
        );
      });
      reportLines.push("");
    });

    if (report.notes && report.notes.length > 0 && report.notes[0]) {
      reportLines.push("─── Notes ───────────────────────────────────");
      reportLines.push("");
      report.notes.forEach((note) => {
        reportLines.push(`- ${note}`);
      });
      reportLines.push("");
    }

    const email = [
      `To: Infrastructure DL; Business Admin; Finance`,
      `Cc: Nathan`,
      `Subject: Weekly Infrastructure Report – ${report.date}`,
      "",
      "Dear Team,",
      "",
      "Please find below the mandatory weekly infrastructure report for this week.",
      "",
      ...reportLines,
      "",
      "─── Action Required ──────────────────────────",
      "",
      "- Development (Paras): Review and log discrepancies by EOD Tuesday.",
      "- Business Admin: Confirm usage vs contract alignment.",
      "- Finance: Reconcile against actual billing.",
      "",
      "Regards,",
      "Infrastructure Reporting Agent",
    ];

    return email.join("\n");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateEmail());
    alert("✅ Email copied to clipboard! Ready to paste into Outlook.");
  };

  return (
    <div className="email-preview">
      <h3>📧 Outlook Email Preview</h3>
      <div className="email-content">{generateEmail()}</div>
      <button className="btn btn-primary copy-btn" onClick={handleCopy}>
        📋 Copy Email
      </button>
    </div>
  );
};

export default EmailPreview;
