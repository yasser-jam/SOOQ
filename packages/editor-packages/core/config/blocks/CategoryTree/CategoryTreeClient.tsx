"use client";

import React, { CSSProperties, useMemo } from "react";
import { resolveColor } from "../../content/color-fields";
import { resolveFontSize } from "../../content/typography-fields";
import { getEditorDataAdapter, useSampleDataInEditor, type CategoryRef } from "../../data-adapter";
import { useStore } from "../../store-context";
import type { CategoryTreeProps } from "./types";

const ALL_VALUE = "__all__";

type NodeProps = {
  category: CategoryRef;
  depth: number;
  activeSlug: string | null;
  textColor: string;
  activeColor: string;
  fontSize: string;
  gap: string;
  indentStep: number;
  showProductCount: boolean;
  isEditing: boolean;
  onSelect: (slug: string) => void;
};

function CategoryTreeNode({
  category,
  depth,
  activeSlug,
  textColor,
  activeColor,
  fontSize,
  gap,
  indentStep,
  showProductCount,
  isEditing,
  onSelect,
}: NodeProps) {
  const isActive = activeSlug === category.slug;

  const linkStyle: CSSProperties = {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingRight: depth * indentStep,
    background: "none",
    border: "none",
    textAlign: "right",
    cursor: isEditing ? "default" : "pointer",
    fontFamily: "inherit",
    fontSize: resolveFontSize(fontSize),
    fontWeight: isActive ? 700 : 400,
    color: isActive ? resolveColor(activeColor) : resolveColor(textColor),
    padding: "6px 0px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <button
        type="button"
        style={linkStyle}
        aria-current={isActive ? "true" : undefined}
        onClick={() => onSelect(category.slug)}
      >
        <span>{category.nameAr || category.nameEn || category.slug}</span>
        {showProductCount && typeof category.productCount === "number" ? (
          <span style={{ opacity: 0.6, fontSize: "0.85em" }}>
            {category.productCount}
          </span>
        ) : null}
      </button>
      {category.children && category.children.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap }}>
          {category.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              activeSlug={activeSlug}
              textColor={textColor}
              activeColor={activeColor}
              fontSize={fontSize}
              gap={gap}
              indentStep={indentStep}
              showProductCount={showProductCount}
              isEditing={isEditing}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CategoryTreeClient({
  textColor = "theme-text",
  activeColor = "theme-primary",
  fontSize = "theme-md",
  gap = 4,
  indentStep = 16,
  showProductCount = false,
  puck,
}: CategoryTreeProps & { puck: { isEditing: boolean } }) {
  const { actions, productsPage } = useStore();
  const adapter = getEditorDataAdapter();
  const sampleMode = puck.isEditing && useSampleDataInEditor();

  const categories = sampleMode
    ? adapter.getSampleCategories()
    : productsPage.categories;

  const activeSlug = productsPage.selectedCategorySlug;

  const gapPx = useMemo(() => (gap ? `${gap}px` : "4px"), [gap]);

  const handleSelect = (slug: string) => {
    if (puck.isEditing) return;
    actions.productsPage.setCategory(slug === ALL_VALUE ? null : slug);
  };

  if (!sampleMode && productsPage.isLoading && categories.length === 0) {
    return (
      <div style={{ color: "var(--theme-neutral, #64748b)", fontSize: 14 }}>
        جارِ تحميل الفئات...
      </div>
    );
  }

  if (categories.length === 0) {
    if (!puck.isEditing) return null;
    return (
      <div style={{ color: "var(--theme-neutral, #64748b)", fontSize: 14 }}>
        لا توجد فئات لعرضها
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: gapPx }}>
      <button
        type="button"
        style={{
          display: "flex",
          width: "100%",
          background: "none",
          border: "none",
          textAlign: "right",
          cursor: puck.isEditing ? "default" : "pointer",
          fontFamily: "inherit",
          fontSize: resolveFontSize(fontSize),
          fontWeight: activeSlug == null ? 700 : 400,
          color:
            activeSlug == null
              ? resolveColor(activeColor)
              : resolveColor(textColor),
          padding: "6px 0px",
        }}
        aria-current={activeSlug == null ? "true" : undefined}
        onClick={() => handleSelect(ALL_VALUE)}
      >
        الكل
      </button>
      {categories.map((category) => (
        <CategoryTreeNode
          key={category.id}
          category={category}
          depth={0}
          activeSlug={activeSlug}
          textColor={textColor}
          activeColor={activeColor}
          fontSize={fontSize}
          gap={gapPx}
          indentStep={indentStep}
          showProductCount={showProductCount}
          isEditing={puck.isEditing}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
