"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SelectGroup {
  label: React.ReactNode;
  options: SelectOption[];
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | SelectGroup)[];
  className?: string;
  style?: React.CSSProperties;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  className = "",
  style,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten options for easy value lookup
  const flatOptions: SelectOption[] = [];
  options.forEach((opt) => {
    if ("options" in opt) {
      flatOptions.push(...opt.options);
    } else {
      flatOptions.push(opt);
    }
  });

  const selectedOption = flatOptions.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{ position: "relative", width: "100%", ...style }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="custom-select-trigger"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px 14px",
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-main)",
          fontSize: "0.9rem",
          fontWeight: 500,
          cursor: "pointer",
          textAlign: "left",
          outline: "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedOption?.icon}
          {selectedOption?.label || "Select..."}
        </span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: "var(--text-muted)",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="custom-select-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 100,
            maxHeight: "240px",
            overflowY: "auto",
            padding: "6px",
            animation: "selectDropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {options.map((opt, i) => {
            if ("options" in opt) {
              return (
                <div key={i} className="custom-select-group" style={{ marginBottom: "6px" }}>
                  <div
                    className="custom-select-group-label"
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      padding: "6px 8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {opt.label}
                  </div>
                  {opt.options.map((subOpt) => (
                    <button
                      key={subOpt.value}
                      type="button"
                      onClick={() => {
                        onChange(subOpt.value);
                        setIsOpen(false);
                      }}
                      className="custom-select-option"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "8px",
                        border: "none",
                        background: "none",
                        borderRadius: "var(--radius-sm)",
                        color: subOpt.value === value ? "var(--primary)" : "var(--text-main)",
                        backgroundColor: subOpt.value === value ? "var(--primary-light)" : "transparent",
                        fontSize: "0.85rem",
                        fontWeight: subOpt.value === value ? 600 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {subOpt.icon}
                      {subOpt.label}
                    </button>
                  ))}
                </div>
              );
            } else {
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="custom-select-option"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px",
                    border: "none",
                    background: "none",
                    borderRadius: "var(--radius-sm)",
                    color: opt.value === value ? "var(--primary)" : "var(--text-main)",
                    backgroundColor: opt.value === value ? "var(--primary-light)" : "transparent",
                    fontSize: "0.85rem",
                    fontWeight: opt.value === value ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
