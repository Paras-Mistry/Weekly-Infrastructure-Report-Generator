import React, { useState, useEffect } from "react";
import WeeklyReportForm from "./components/WeeklyReportForm";
import ReportPreview from "./components/ReportPreview";
import EmailPreview from "./components/EmailPreview";
import ReportHistory from "./components/ReportHistory";
import { useReports } from "./hooks/useReports";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("form");
  const [currentReport, setCurrentReport] = useState(null);
  const { reports, saveReport, deleteReport, getLatestReport } = useReports();

  const handleReportGenerated = (reportData) => {
    const reportWithMetadata = {
      ...reportData,
      id: Date.now().toString(),
      generatedAt: new Date().toISOString(),
      weekStart: reportData.date,
    };
    saveReport(reportWithMetadata);
    setCurrentReport(reportWithMetadata);
    setActiveTab("preview");
  };

  useEffect(() => {
    const latest = getLatestReport();
    if (latest) {
      setCurrentReport(latest);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="eyebrow">Infrastructure</span>
          Weekly Report
        </h1>
        <div className="header-nav">
          <button
            className={activeTab === "form" ? "active" : ""}
            onClick={() => setActiveTab("form")}
          >
            New report
          </button>
          <button
            className={activeTab === "preview" ? "active" : ""}
            onClick={() => setActiveTab("preview")}
            disabled={!currentReport}
          >
            Preview
          </button>
          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeTab === "form" && (
          <WeeklyReportForm onReportGenerated={handleReportGenerated} />
        )}

        {activeTab === "preview" && currentReport && (
          <div className="preview-container">
            <ReportPreview report={currentReport} />
            <EmailPreview report={currentReport} />
          </div>
        )}

        {activeTab === "history" && (
          <ReportHistory
            reports={reports}
            onSelectReport={setCurrentReport}
            onDeleteReport={deleteReport}
          />
        )}
      </main>
    </div>
  );
}

export default App;
