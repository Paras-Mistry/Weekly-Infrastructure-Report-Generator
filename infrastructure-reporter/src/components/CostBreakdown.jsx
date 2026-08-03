import React from "react";
import {
  buildServiceStats,
  groupBySystem,
  generateServiceHistory,
} from "./reportGenerator";
import { formatMoney, statusEmoji } from "../utils/currencyFormatter";

// Renders a simple week-by-week trend line for a volatile service, e.g.:
// Week 9 (May 24): £28.59 🟢  Week 10 (May 31): £41.05 🔴  Week 11 (Jun 7): £32.38 🟢
const ServiceHistory = ({ history }) => {
  if (!history || history.length < 2) return null;

  return (
    <div className="service-history">
      <span className="service-history-label">Trend:</span>
      <ul className="service-history-list">
        {history.map((h, i) => {
          const prev = history[i - 1];
          const pct =
            prev && prev.cost
              ? ((h.cost - prev.cost) / Math.abs(prev.cost)) * 100
              : 0;
          return (
            <li key={i}>
              Week {h.week} ({h.date}): {formatMoney(h.cost, h.currency)}{" "}
              {i > 0 ? statusEmoji(pct) : ""}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// `allReports` (from useReports().reports) is optional — pass it to enable
// the multi-week trend line for services flagged critical/high this week.
const CostBreakdown = ({ report, allReports = [] }) => {
  const stats = buildServiceStats(report);
  const grouped = groupBySystem(stats);

  return (
    <div className="cost-breakdown">
      <h3>Cost breakdown</h3>
      {Object.entries(grouped).map(([system, services]) => {
        const currency = services[0]?.currency || "$";
        const sysCurrent = services.reduce((a, s) => a + s.currentCost, 0);
        const sysLast = services.reduce((a, s) => a + s.lastWeekCost, 0);
        const sysDiff = sysCurrent - sysLast;
        const sysPct = sysLast
          ? ((sysCurrent - sysLast) / Math.abs(sysLast)) * 100
          : 0;

        return (
          <div key={system} className="cost-breakdown-group">
            <h4>
              {system} Total ({currency}) — {formatMoney(sysCurrent, currency)}{" "}
              <span className="delta">
                {sysDiff >= 0 ? "+" : "-"}
                {currency}
                {Math.abs(sysDiff).toFixed(2)} ({sysPct >= 0 ? "+" : ""}
                {sysPct.toFixed(0)}%) {statusEmoji(sysPct)}
              </span>
            </h4>
            <table className="cost-breakdown-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Current</th>
                  <th>Last Week</th>
                  <th>Change</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr>
                      <td>{s.name}</td>
                      <td>{formatMoney(s.currentCost, s.currency)}</td>
                      <td>{formatMoney(s.lastWeekCost, s.currency)}</td>
                      <td>
                        {s.arrow} {s.diff >= 0 ? "+" : "-"}
                        {s.currency}
                        {Math.abs(s.diff).toFixed(2)} ({s.pct >= 0 ? "+" : ""}
                        {s.pct.toFixed(0)}%)
                      </td>
                      <td>{statusEmoji(s.pct)}</td>
                    </tr>
                    {(s.severity === "critical" || s.severity === "high") &&
                      allReports.length > 0 && (
                        <tr className="service-history-row">
                          <td colSpan={5}>
                            <ServiceHistory
                              history={generateServiceHistory(
                                s.system,
                                s.name,
                                allReports,
                                report,
                              )}
                            />
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default CostBreakdown;
