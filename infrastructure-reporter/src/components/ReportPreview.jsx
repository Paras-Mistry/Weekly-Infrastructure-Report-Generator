import React from "react";
import { generateReportBody } from "./reportGenerator";

const ReportPreview = ({ report, allReports = [] }) => {
  const text = generateReportBody(report, allReports);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    alert("Report copied to clipboard.");
  };

  return (
    <div className="report-preview">
      <h3>Report preview</h3>
      <pre className="report-content">{text}</pre>
      <button className="btn btn-secondary copy-btn" onClick={handleCopy}>
        Copy report
      </button>
    </div>
  );
};

export default ReportPreview;
