import {
  pctChange,
  changeArrow,
  statusEmoji,
  formatMoney,
} from "../utils/currencyFormatter";

// ---- Config -----------------------------------------------------------
// Tune these to match how strict you want the alert tiers to be.
export const THRESHOLDS = {
  critical: 25, // >= this % change (either direction) => CRITICAL
  high: 15, // >= this % change => HIGH PRIORITY
  moderate: 5, // >= this % change => MODERATE
};

// Services/vendors that should be called out as "unauthorised / out-of-scope"
// when they show a notable increase. Edit freely.
export const UNAUTHORIZED_VENDORS = ["AssemblyAI"];

// ---- Core stats ---------------------------------------------------------

function classifySeverity(pct) {
  const abs = Math.abs(pct);
  if (pct <= 0) return "positive";
  if (abs >= THRESHOLDS.critical) return "critical";
  if (abs >= THRESHOLDS.high) return "high";
  if (abs >= THRESHOLDS.moderate) return "moderate";
  return "flat";
}

export function buildServiceStats(report) {
  return report.services.map((s) => {
    const diff = s.currentCost - s.lastWeekCost;
    const pct = pctChange(s.currentCost, s.lastWeekCost);
    return {
      ...s,
      diff,
      pct,
      severity: classifySeverity(pct),
      arrow: changeArrow(diff),
    };
  });
}

export function groupBySystem(services) {
  return services.reduce((acc, s) => {
    (acc[s.system] = acc[s.system] || []).push(s);
    return acc;
  }, {});
}

// ---- Headlines -----------------------------------------------------------

// Picks the biggest dollar movers (excluding "flat") as headline bullets.
export function generateHeadlines(report, { max = 3 } = {}) {
  const stats = buildServiceStats(report);
  const movers = stats
    .filter((s) => s.severity !== "flat")
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, max);

  return movers.map((s) => {
    const dir = s.diff > 0 ? "increased" : "decreased";
    const pctLabel = `${s.pct >= 0 ? "+" : ""}${s.pct.toFixed(0)}%`;
    return `${s.system} "${s.name}" ${dir} by ${s.diff >= 0 ? "+" : "-"}${s.currency}${Math.abs(s.diff).toFixed(2)} (${pctLabel}).`;
  });
}

// ---- Alerts ----------------------------------------------------------

export function generateAlerts(report) {
  const stats = buildServiceStats(report);
  const alerts = { critical: [], high: [], moderate: [], positive: [] };

  stats.forEach((s) => {
    const label = `${s.system} ${s.name}: ${formatMoney(s.currentCost, s.currency)} (${s.pct >= 0 ? "+" : ""}${s.pct.toFixed(0)}%)`;
    const isUnauthorized =
      UNAUTHORIZED_VENDORS.includes(s.name) ||
      UNAUTHORIZED_VENDORS.includes(s.system);

    if (s.severity === "critical") {
      alerts.critical.push(
        `🔴 ${label} - Significant cost swing requiring review.`,
      );
    } else if (s.severity === "high") {
      const note = isUnauthorized
        ? "Increase on an unauthorised out-of-scope vendor."
        : "Notable increase.";
      alerts.high.push(`🟠 ${label} - ${note}`);
    } else if (s.severity === "moderate") {
      alerts.moderate.push(`🟡 ${label} - Moderate upward drift.`);
    }
  });

  const totalPct = pctChange(report.totals.current, report.totals.lastWeek);
  if (totalPct < 0) {
    alerts.positive.push(
      `🟢 Overall platform spend decreased by ${Math.abs(totalPct).toFixed(0)}%.`,
    );
  }
  const flatCount = stats.filter(
    (s) => s.severity === "flat" || s.severity === "positive",
  ).length;
  if (flatCount > 0 && alerts.positive.length === 0) {
    alerts.positive.push(
      `🟢 ${flatCount} of ${stats.length} line items held flat or improved this week.`,
    );
  }

  return alerts;
}

// ---- Multi-week trend/history (needs past reports, e.g. from useReports) --

// Builds a week-by-week trend for one service by name+system across saved reports.
export function generateServiceHistory(
  system,
  name,
  allReports,
  currentReport,
) {
  const combined = [...allReports, currentReport].filter(Boolean);
  const relevant = combined
    .filter((r) =>
      r.services.some((s) => s.system === system && s.name === name),
    )
    .sort(
      (a, b) =>
        new Date(a.generatedAt || a.date) - new Date(b.generatedAt || b.date),
    );

  return relevant.map((r, i) => {
    const svc = r.services.find((s) => s.system === system && s.name === name);
    return {
      week: i + 1,
      date: r.date,
      cost: svc.currentCost,
      currency: svc.currency,
    };
  });
}

// ---- Full report body (shared by ReportPreview + EmailPreview) -----------

// `allReports` is optional (pass useReports().reports) — when supplied,
// services flagged critical/high get a week-by-week trend line appended.
export function generateReportBody(report, allReports = []) {
  const stats = buildServiceStats(report);
  const grouped = groupBySystem(stats);
  const lines = [];

  lines.push(`Weekly Infrastructure Report – ${report.date}`);
  lines.push("");
  lines.push("Headlines this week:");
  const headlines = report.headlines?.length
    ? report.headlines
    : generateHeadlines(report);
  if (headlines.length) {
    headlines.forEach((h) => lines.push(`* ${h}`));
  } else {
    lines.push("* No notable cost movements this week.");
  }
  lines.push("");
  lines.push("COST SUMMARY");
  lines.push("");

  Object.entries(grouped).forEach(([system, services]) => {
    const currency = services[0]?.currency || "$";
    const sysCurrent = services.reduce((a, s) => a + s.currentCost, 0);
    const sysLast = services.reduce((a, s) => a + s.lastWeekCost, 0);
    const sysDiff = sysCurrent - sysLast;
    const sysPct = pctChange(sysCurrent, sysLast);

    lines.push(`${system} Total (${currency}):`);
    services.forEach((s) =>
      lines.push(`${s.name}: ${formatMoney(s.currentCost, s.currency)}`),
    );
    lines.push(`${system} Total: ${formatMoney(sysCurrent, currency)}`);
    lines.push(`Last Week: ${formatMoney(sysLast, currency)}`);
    lines.push(
      `Change: ${sysDiff >= 0 ? "+" : "-"}${currency}${Math.abs(sysDiff).toFixed(2)} (${sysPct >= 0 ? "+" : ""}${sysPct.toFixed(0)}%) ${statusEmoji(sysPct)}`,
    );
    lines.push("");
  });

  lines.push("DETAILED SERVICE BREAKDOWN");
  lines.push("");
  Object.entries(grouped).forEach(([system, services]) => {
    services.forEach((s) => {
      lines.push(`${system} - ${s.name}: ${s.severity.toUpperCase()}`);
      lines.push(
        `${formatMoney(s.lastWeekCost, s.currency)} → ${formatMoney(s.currentCost, s.currency)} (${s.diff >= 0 ? "+" : "-"}${s.currency}${Math.abs(s.diff).toFixed(2)}, ${s.pct >= 0 ? "+" : ""}${s.pct.toFixed(0)}%) ${statusEmoji(s.pct)}`,
      );

      if (
        (s.severity === "critical" || s.severity === "high") &&
        allReports.length > 0
      ) {
        const history = generateServiceHistory(
          s.system,
          s.name,
          allReports,
          report,
        );
        if (history.length > 1) {
          lines.push(`${s.name} History:`);
          history.forEach((h, i) => {
            const prev = history[i - 1];
            const pct =
              prev && prev.cost
                ? ((h.cost - prev.cost) / Math.abs(prev.cost)) * 100
                : 0;
            const marker = i > 0 ? statusEmoji(pct) : "";
            lines.push(
              `* Week ${h.week} (${h.date}): ${formatMoney(h.cost, h.currency)} ${marker}`,
            );
          });
        }
      }
    });
  });
  lines.push("");

  lines.push("ALERTS & RED FLAGS");
  const alerts = generateAlerts(report);
  if (alerts.critical.length) {
    lines.push("CRITICAL:");
    alerts.critical.forEach((a) => lines.push(a));
    lines.push("");
  }
  if (alerts.high.length) {
    lines.push("HIGH PRIORITY:");
    alerts.high.forEach((a) => lines.push(a));
    lines.push("");
  }
  if (alerts.moderate.length) {
    lines.push("MODERATE:");
    alerts.moderate.forEach((a) => lines.push(a));
    lines.push("");
  }
  if (alerts.positive.length) {
    lines.push("POSITIVE:");
    alerts.positive.forEach((a) => lines.push(a));
    lines.push("");
  }

  if (report.newEnvironments?.length) {
    lines.push("New environments created:");
    report.newEnvironments.forEach((e) => lines.push(`- ${e}`));
    lines.push("");
  }

  if (report.upgrades?.length) {
    lines.push("Upgrades/additional services provisioned:");
    report.upgrades.forEach((u) => lines.push(`- ${u}`));
    lines.push("");
  }

  if (report.notes?.length) {
    lines.push("Additional Notes:");
    report.notes.forEach((n) => lines.push(`- ${n}`));
  }

  return lines.join("\n").trim();
}

export function generateEmailBody(report, allReports = []) {
  const body = generateReportBody(report, allReports);
  return [
    "Hello Nathan,",
    "",
    `Please find the weekly infrastructure costs report below for the week ending ${report.date}.`,
    "",
    body,
    "",
    "Regards,",
    "Infrastructure Reporting Agent",
  ].join("\n");
}
