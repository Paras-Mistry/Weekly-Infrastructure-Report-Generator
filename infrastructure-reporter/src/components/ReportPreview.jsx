import React from "react";

const ReportPreview = ({ report }) => {
  const generateReport = () => {
    const lines = [
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

    // Group services by system
    const grouped = report.services.reduce((acc, service) => {
      if (!acc[service.system]) acc[service.system] = [];
      acc[service.system].push(service);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([system, services]) => {
      const currency = services[0]?.currency || "$";
      lines.push(`${system}:`);
      services.forEach((s) => {
        const diff = s.currentCost - s.lastWeekCost;
        const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "↔";
        lines.push(
          `  – ${s.name}: ${currency}${s.currentCost.toFixed(2)} (${arrow} ${currency}${Math.abs(diff).toFixed(2)})`,
        );
      });
      lines.push("");
    });

    if (report.notes && report.notes.length > 0 && report.notes[0]) {
      lines.push("─── Notes ───────────────────────────────────");
      lines.push("");
      report.notes.forEach((note) => {
        lines.push(`- ${note}`);
      });
      lines.push("");
    }

    return lines.join("\n");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReport());
    alert("Report copied to clipboard.");
  };

  return (
    <div className="report-preview">
      <h3>Report preview</h3>
      <div className="report-content">{generateReport()}</div>
      <button className="btn btn-secondary copy-btn" onClick={handleCopy}>
        Copy report
      </button>
    </div>
  );
};

export default ReportPreview;
