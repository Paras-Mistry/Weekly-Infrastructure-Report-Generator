import React, { useState } from "react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

const SYSTEMS = ["GCP", "AWS", "OpenAI", "AssemblyAI"];
const CURRENCIES = ["$", "£", "€"];

const WeeklyReportForm = ({ onReportGenerated }) => {
  const [formData, setFormData] = useState({
    date: format(new Date(), "dd MMMM yyyy"),
    systems: SYSTEMS,
    newEnvironments: ["None"],
    upgrades: ["None"],
    notes: [""],
    services: [
      {
        id: uuidv4(),
        system: "GCP",
        name: "",
        currentCost: "",
        lastWeekCost: "",
        currency: "£",
      },
      {
        id: uuidv4(),
        system: "AWS",
        name: "",
        currentCost: "",
        lastWeekCost: "",
        currency: "$",
      },
    ],
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: uuidv4(),
          system: "AWS",
          name: "",
          currentCost: "",
          lastWeekCost: "",
          currency: "$",
        },
      ],
    }));
  };

  const removeService = (id) => {
    if (formData.services.length <= 1) {
      alert("You need at least one service entry");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayItem = (field, index) => {
    if (formData[field].length <= 1) {
      alert("You need at least one entry");
      return;
    }
    setFormData((prev) => {
      const newArray = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: newArray };
    });
  };

  const calculateTotal = () => {
    let total = 0;
    let lastWeekTotal = 0;

    formData.services.forEach((service) => {
      const current = parseFloat(service.currentCost) || 0;
      const last = parseFloat(service.lastWeekCost) || 0;
      total += current;
      lastWeekTotal += last;
    });

    return { total, lastWeekTotal };
  };

  const validateForm = () => {
    const newErrors = {};
    let hasEmptyService = false;

    formData.services.forEach((service) => {
      if (!service.name.trim()) hasEmptyService = true;
    });

    if (hasEmptyService) {
      newErrors.services = "All services must have a name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const { total, lastWeekTotal } = calculateTotal();
    const reportData = {
      date: formData.date,
      systems: formData.systems,
      newEnvironments: formData.newEnvironments.filter((e) => e.trim()),
      upgrades: formData.upgrades.filter((u) => u.trim()),
      notes: formData.notes.filter((n) => n.trim()),
      services: formData.services.map((s) => ({
        ...s,
        currentCost: parseFloat(s.currentCost) || 0,
        lastWeekCost: parseFloat(s.lastWeekCost) || 0,
      })),
      totals: {
        current: total,
        lastWeek: lastWeekTotal,
        change: total - lastWeekTotal,
        changePercent:
          lastWeekTotal > 0
            ? ((total - lastWeekTotal) / lastWeekTotal) * 100
            : 0,
      },
    };

    onReportGenerated(reportData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Report date</h2>
        <div className="form-group">
          <input
            type="text"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            placeholder="e.g., 26 July 2026"
            required
          />
        </div>
      </div>

      <div className="form-section">
        <h2>Systems covered</h2>
        <div className="form-group">
          <input type="text" value={formData.systems.join(", ")} disabled />
          <small className="form-hint">
            Currently: {formData.systems.join(", ")}
          </small>
        </div>
      </div>

      <div className="form-section">
        <h2>New environments created</h2>
        {formData.newEnvironments.map((item, index) => (
          <div
            key={index}
            className="service-entry service-entry-simple">
            <input
              type="text"
              value={item}
              onChange={(e) =>
                handleArrayChange("newEnvironments", index, e.target.value)
              }
              placeholder="e.g., sandbox-ml – AWS (us-east-1) – ML prototyping"
            />
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeArrayItem("newEnvironments", index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm btn-add"
          onClick={() => addArrayItem("newEnvironments")}
        >
          + Add Environment
        </button>
      </div>

      <div className="form-section">
        <h2>Upgrades / additional services</h2>
        {formData.upgrades.map((item, index) => (
          <div
            key={index}
            className="service-entry service-entry-simple">
            <input
              type="text"
              value={item}
              onChange={(e) =>
                handleArrayChange("upgrades", index, e.target.value)
              }
              placeholder="e.g., RDS PostgreSQL 14→15 – AWS Production"
            />
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeArrayItem("upgrades", index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm btn-add"
          onClick={() => addArrayItem("upgrades")}
        >
          + Add Upgrade
        </button>
      </div>

      <div className="form-section">
        <h2>Cost breakdown</h2>
        {errors.services && (
          <div className="form-error">{errors.services}</div>
        )}

        {formData.services.map((service, index) => (
          <div key={service.id} className="service-entry">
            <div className="form-group">
              <label>Service Name</label>
              <input
                type="text"
                value={service.name}
                onChange={(e) =>
                  handleServiceChange(service.id, "name", e.target.value)
                }
                placeholder="e.g., Flabelus"
                required
              />
            </div>
            <div className="form-group">
              <label>System</label>
              <select
                value={service.system}
                onChange={(e) =>
                  handleServiceChange(service.id, "system", e.target.value)
                }
              >
                {SYSTEMS.map((sys) => (
                  <option key={sys} value={sys}>
                    {sys}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={service.currency}
                onChange={(e) =>
                  handleServiceChange(service.id, "currency", e.target.value)
                }
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Current Cost</label>
              <input
                type="number"
                step="0.01"
                value={service.currentCost}
                onChange={(e) =>
                  handleServiceChange(service.id, "currentCost", e.target.value)
                }
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Week</label>
              <input
                type="number"
                step="0.01"
                value={service.lastWeekCost}
                onChange={(e) =>
                  handleServiceChange(
                    service.id,
                    "lastWeekCost",
                    e.target.value,
                  )
                }
                placeholder="0.00"
                required
              />
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeService(service.id)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm btn-add"
          onClick={addService}
        >
          + Add Service
        </button>
      </div>

      <div className="form-section">
        <h2>Additional notes</h2>
        {formData.notes.map((note, index) => (
          <div
            key={index}
            className="service-entry service-entry-simple">
            <input
              type="text"
              value={note}
              onChange={(e) =>
                handleArrayChange("notes", index, e.target.value)
              }
              placeholder="e.g., ML sandbox temporary – decommission in 60 days"
            />
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeArrayItem("notes", index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm btn-add"
          onClick={() => addArrayItem("notes")}
        >
          + Add Note
        </button>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Generate report
        </button>
      </div>
    </form>
  );
};

export default WeeklyReportForm;
