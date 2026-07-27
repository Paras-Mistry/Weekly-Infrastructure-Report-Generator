import { useState, useEffect } from "react";

export const useReports = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Load reports from localStorage on mount
    const saved = localStorage.getItem("infrastructure_reports");
    if (saved) {
      try {
        setReports(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load reports:", e);
        setReports([]);
      }
    }
  }, []);

  const saveReport = (report) => {
    setReports((prev) => {
      const updated = [report, ...prev];
      localStorage.setItem("infrastructure_reports", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteReport = (id) => {
    setReports((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem("infrastructure_reports", JSON.stringify(updated));
      return updated;
    });
  };

  const getLatestReport = () => {
    if (reports.length === 0) return null;
    const sorted = [...reports].sort(
      (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt),
    );
    return sorted[0];
  };

  const getReportByDate = (date) => {
    return reports.find((r) => r.date === date);
  };

  return {
    reports,
    saveReport,
    deleteReport,
    getLatestReport,
    getReportByDate,
  };
};
