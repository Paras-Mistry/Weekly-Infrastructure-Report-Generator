import React from "react";
import { format } from "date-fns";

const ReportHistory = ({ reports, onSelectReport, onDeleteReport }) => {
  if (reports.length === 0) {
    return (
      <div className="empty-state">
        <h3>📭 No reports yet</h3>
        <p>
          Generate your first weekly infrastructure report using the "New
          Report" tab.
        </p>
      </div>
    );
  }

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt),
  );

  return (
    <div>
      <h3 style={{ marginBottom: "16px" }}>
        📚 Report History ({reports.length} reports)
      </h3>
      <div className="history-list">
        {sortedReports.map((report) => (
          <div key={report.id} className="history-item">
            <div
              className="history-item-info"
              onClick={() => onSelectReport(report)}
            >
              <span className="date">📅 {report.date}</span>
              <span className="cost">
                💰 ${report.totals.current.toFixed(2)}
                <span
                  style={{
                    color: report.totals.change >= 0 ? "#ef4444" : "#22c55e",
                    marginLeft: "8px",
                    fontSize: "13px",
                  }}
                >
                  ({report.totals.change >= 0 ? "+" : ""}
                  {report.totals.changePercent.toFixed(1)}%)
                </span>
              </span>
              <span className="changes">
                {report.services.length} services
                {report.newEnvironments.length > 0 &&
                  ` • ${report.newEnvironments.length} new env`}
                {report.upgrades.length > 0 &&
                  ` • ${report.upgrades.length} upgrades`}
              </span>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                {format(new Date(report.generatedAt), "MMM d, yyyy h:mm a")}
              </span>
            </div>
            <div className="history-actions">
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Delete this report?")) {
                    onDeleteReport(report.id);
                  }
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportHistory;
