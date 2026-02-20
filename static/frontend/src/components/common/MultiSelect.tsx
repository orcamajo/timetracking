import React, { useState, useRef, useEffect } from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  placeholder: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  };

  const selectAll = () => {
    onChange(new Set(options.map((o) => o.value)));
  };

  const clearAll = () => {
    onChange(new Set());
  };

  const label =
    selected.size === 0
      ? placeholder
      : selected.size === options.length
      ? `All ${placeholder.toLowerCase()}`
      : selected.size === 1
      ? options.find((o) => selected.has(o.value))?.label ?? "1 selected"
      : `${selected.size} selected`;

  return (
    <div className="multiselect" ref={containerRef}>
      <button
        className="multiselect-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="multiselect-label">{label}</span>
        <span className="multiselect-arrow">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <div className="multiselect-dropdown">
          <div className="multiselect-actions">
            <button type="button" onClick={selectAll}>
              Select all
            </button>
            <button type="button" onClick={clearAll}>
              Clear
            </button>
          </div>
          <div className="multiselect-options">
            {options.map((option) => (
              <label key={option.value} className="multiselect-option">
                <input
                  type="checkbox"
                  checked={selected.has(option.value)}
                  onChange={() => toggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
