"use client";
import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("AdvancedModal", styles);

// ─── Types ──────────────────────────────────────────────────────────────────

export type AdvancedStyleProps = {
  // Colors
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  priceColor: string;
  borderColor: string;
  // Typography
  titleFontSize: string;
  titleFontWeight: string;
  descriptionFontSize: string;
  descriptionLineClamp: number; // 0 = no clamp
  priceFontSize: string;
  // Spacing & Layout
  borderRadius: string;
  cardPadding: string;
  contentGap: string;
  imageWidth: string; // for horizontal layout
  // Effects
  borderWidth: string;
  boxShadow: string;
};

export const DEFAULT_ADVANCED: AdvancedStyleProps = {
  backgroundColor: "",
  textColor: "",
  accentColor: "",
  priceColor: "",
  borderColor: "",
  titleFontSize: "",
  titleFontWeight: "",
  descriptionFontSize: "",
  descriptionLineClamp: 3,
  priceFontSize: "",
  borderRadius: "",
  cardPadding: "",
  contentGap: "",
  imageWidth: "",
  borderWidth: "",
  boxShadow: "",
};

type SectionId = "colors" | "typography" | "spacing" | "effects";

// ─── Micro-components ────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={getClassName("field")}>
      <label className={getClassName("label")}>{label}</label>
      {children}
    </div>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={getClassName("colorRow")}>
      <input
        type="color"
        className={getClassName("colorSwatch")}
        value={value || "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        title="Pick a color"
      />
      <div className={getClassName("inputRow")}>
        <input
          type="text"
          className={getClassName("textInput")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. #ffffff"
        />
        {value && (
          <button
            type="button"
            className={getClassName("clearBtn")}
            onClick={() => onChange("")}
            title="Reset to default"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={getClassName("inputRow")}>
      <input
        type="text"
        className={getClassName("textInput")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "auto"}
      />
      {value && (
        <button
          type="button"
          className={getClassName("clearBtn")}
          onClick={() => onChange("")}
          title="Reset to default"
        >
          ×
        </button>
      )}
    </div>
  );
}

function SectionPanel({
  id,
  title,
  expanded,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  expanded: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={getClassName("section")}>
      <button
        type="button"
        className={getClassName("sectionHeader")}
        onClick={() => onToggle(id)}
      >
        <span>{title}</span>
        <span className={getClassName("chevron")}>{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className={getClassName("sectionBody")}>
          <div className={getClassName("grid")}>{children}</div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface AdvancedModalProps {
  value: AdvancedStyleProps;
  onChange: (value: AdvancedStyleProps) => void;
}

export function AdvancedModal({ value, onChange }: AdvancedModalProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<SectionId>>(
    () => new Set(["colors", "typography", "spacing", "effects"])
  );

  const update = useCallback(
    <K extends keyof AdvancedStyleProps>(key: K, val: AdvancedStyleProps[K]) => {
      onChange({ ...value, [key]: val });
    },
    [value, onChange]
  );

  const toggleSection = useCallback((id: SectionId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    onChange({ ...DEFAULT_ADVANCED });
  }, [onChange]);

  if (typeof document === "undefined") return null;

  return (
    <>
      <button
        type="button"
        className={getClassName("trigger")}
        onClick={() => setOpen(true)}
      >
        <span className={getClassName("triggerIcon")}>✦</span>
        Customize Design
      </button>

      {open &&
        createPortal(
          <div className={getClassName("overlay")}>
            <div
              className={getClassName("panel")}
              role="dialog"
              aria-modal
              aria-label="Advanced Card Customization"
            >
              {/* Header */}
              <div className={getClassName("header")}>
                <div className={getClassName("headerLeft")}>
                  <h2 className={getClassName("title")}>
                    Advanced Card Customization
                  </h2>
                  <p className={getClassName("subtitle")}>
                    Fine-tune this card's appearance with precise values
                  </p>
                </div>
                <button
                  type="button"
                  className={getClassName("closeBtn")}
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className={getClassName("body")}>
                <p className={getClassName("hint")}>
                  Leave any field empty to use the defaults set by the Color
                  Scheme. All changes apply live to the canvas preview.
                </p>

                {/* ── Colors ── */}
                <SectionPanel
                  id="colors"
                  title="Colors"
                  expanded={expanded.has("colors")}
                  onToggle={toggleSection}
                >
                  <FieldWrapper label="Background">
                    <ColorInput
                      value={value.backgroundColor}
                      onChange={(v) => update("backgroundColor", v)}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Text">
                    <ColorInput
                      value={value.textColor}
                      onChange={(v) => update("textColor", v)}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Accent / Links">
                    <ColorInput
                      value={value.accentColor}
                      onChange={(v) => update("accentColor", v)}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Price Color">
                    <ColorInput
                      value={value.priceColor}
                      onChange={(v) => update("priceColor", v)}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Border Color">
                    <ColorInput
                      value={value.borderColor}
                      onChange={(v) => update("borderColor", v)}
                    />
                  </FieldWrapper>
                </SectionPanel>

                {/* ── Typography ── */}
                <SectionPanel
                  id="typography"
                  title="Typography"
                  expanded={expanded.has("typography")}
                  onToggle={toggleSection}
                >
                  <FieldWrapper label="Title Font Size">
                    <TextInput
                      value={value.titleFontSize}
                      onChange={(v) => update("titleFontSize", v)}
                      placeholder="e.g. 20px"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Title Font Weight">
                    <TextInput
                      value={value.titleFontWeight}
                      onChange={(v) => update("titleFontWeight", v)}
                      placeholder="e.g. 700"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Description Font Size">
                    <TextInput
                      value={value.descriptionFontSize}
                      onChange={(v) => update("descriptionFontSize", v)}
                      placeholder="e.g. 14px"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Description Line Clamp">
                    <input
                      type="number"
                      className={getClassName("numberInput")}
                      value={value.descriptionLineClamp}
                      min={0}
                      max={10}
                      title="0 = show all lines"
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        update("descriptionLineClamp", isNaN(n) ? 0 : n);
                      }}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Price Font Size">
                    <TextInput
                      value={value.priceFontSize}
                      onChange={(v) => update("priceFontSize", v)}
                      placeholder="e.g. 20px"
                    />
                  </FieldWrapper>
                </SectionPanel>

                {/* ── Spacing & Layout ── */}
                <SectionPanel
                  id="spacing"
                  title="Spacing & Layout"
                  expanded={expanded.has("spacing")}
                  onToggle={toggleSection}
                >
                  <FieldWrapper label="Border Radius">
                    <TextInput
                      value={value.borderRadius}
                      onChange={(v) => update("borderRadius", v)}
                      placeholder="e.g. 12px"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Card Padding">
                    <TextInput
                      value={value.cardPadding}
                      onChange={(v) => update("cardPadding", v)}
                      placeholder="e.g. 20px"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Content Gap">
                    <TextInput
                      value={value.contentGap}
                      onChange={(v) => update("contentGap", v)}
                      placeholder="e.g. 12px"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Image Width (Horizontal)">
                    <TextInput
                      value={value.imageWidth}
                      onChange={(v) => update("imageWidth", v)}
                      placeholder="e.g. 260px"
                    />
                  </FieldWrapper>
                </SectionPanel>

                {/* ── Effects ── */}
                <SectionPanel
                  id="effects"
                  title="Effects"
                  expanded={expanded.has("effects")}
                  onToggle={toggleSection}
                >
                  <FieldWrapper label="Border Width">
                    <TextInput
                      value={value.borderWidth}
                      onChange={(v) => update("borderWidth", v)}
                      placeholder="e.g. 1px"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Box Shadow">
                    <TextInput
                      value={value.boxShadow}
                      onChange={(v) => update("boxShadow", v)}
                      placeholder="e.g. 0 4px 12px rgba(0,0,0,0.1)"
                    />
                  </FieldWrapper>
                </SectionPanel>
              </div>

              {/* Footer */}
              <div className={getClassName("footer")}>
                <button
                  type="button"
                  className={getClassName("resetBtn")}
                  onClick={reset}
                >
                  Reset to Defaults
                </button>
                <button
                  type="button"
                  className={getClassName("doneBtn")}
                  onClick={() => setOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
