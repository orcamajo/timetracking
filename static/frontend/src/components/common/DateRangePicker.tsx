import React from "react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChange(e.target.value, endDate)}
          style={{ padding: "4px 8px", fontSize: 13 }}
        />
      </div>
      <span style={{ color: "var(--color-text-subtle)" }}>to</span>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onChange(startDate, e.target.value)}
          style={{ padding: "4px 8px", fontSize: 13 }}
        />
      </div>
    </div>
  );
}
