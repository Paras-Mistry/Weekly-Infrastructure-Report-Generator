import React from "react";
import { generateEmailBody } from "./reportGenerator";

const EmailPreview = ({ report, allReports = [] }) => {
  const text = generateEmailBody(report, allReports);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    alert("Email copied to clipboard. Ready to paste into Outlook.");
  };

  return (
    <div className="email-preview">
      <h3>Outlook email preview</h3>
      <pre className="email-content">{text}</pre>
      <button className="btn btn-primary copy-btn" onClick={handleCopy}>
        Copy email
      </button>
    </div>
  );
};

export default EmailPreview;
