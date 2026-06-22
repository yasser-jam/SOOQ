"use client";
import styles from "./styles.module.css";
import getClassNameFactory from "../../lib/get-class-name-factory";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../store";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Drawer } from "../Drawer";

const getClassName = getClassNameFactory("ComponentList", styles);

const ComponentListItem = ({
  name,
  label,
}: {
  name: string;
  label?: string;
  index?: number; // TODO deprecate
}) => {
  const overrides = useAppStore((s) => s.overrides);
  const canInsert = useAppStore(
    (s) =>
      s.permissions.getPermissions({
        type: name,
      }).insert
  );

  // DEPRECATED
  useEffect(() => {
    if (overrides.componentItem) {
      console.warn(
        "The `componentItem` override has been deprecated and renamed to `drawerItem`"
      );
    }
  }, [overrides]);

  return (
    <Drawer.Item label={label} name={name} isDragDisabled={!canInsert}>
      {overrides.componentItem ?? overrides.drawerItem}
    </Drawer.Item>
  );
};

const ComponentList = ({
  children,
  title,
  id,
  searchable,
}: {
  id: string;
  children?: ReactNode;
  title?: string;
  searchable?: boolean;
}) => {
  const config = useAppStore((s) => s.config);
  const setUi = useAppStore((s) => s.setUi);
  const componentList = useAppStore((s) => s.state.ui.componentList);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const canSearch = searchable && !children;

  const { expanded = true } = componentList[id] || {};

  const componentEntriesAll = useMemo(
    () =>
      Object.keys(config.components).map((componentKey) => ({
        key: componentKey,
        label: config.components[componentKey]?.label ?? componentKey,
      })),
    [config.components]
  );

  const componentEntries = useMemo(() => {
    if (!canSearch) return componentEntriesAll;

    const scored = componentEntriesAll
      .map((entry) => {
        const labelLower = entry.label.toLowerCase();
        const keyLower = entry.key.toLowerCase();

        if (!normalizedQuery) {
          return {
            ...entry,
            score: 0,
          };
        }

        const labelStartsWith = labelLower.startsWith(normalizedQuery);
        const keyStartsWith = keyLower.startsWith(normalizedQuery);
        const labelIncludes = labelLower.includes(normalizedQuery);
        const keyIncludes = keyLower.includes(normalizedQuery);

        if (!labelIncludes && !keyIncludes) {
          return null;
        }

        const score = labelStartsWith
          ? 0
          : keyStartsWith
          ? 1
          : labelIncludes
          ? 2
          : 3;

        return {
          ...entry,
          score,
        };
      })
      .filter(
        (
          entry
        ): entry is {
          key: string;
          label: string;
          score: number;
        } => Boolean(entry)
      )
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.label.localeCompare(b.label);
      });

    return scored;
  }, [canSearch, componentEntriesAll, normalizedQuery]);

  const totalCount = componentEntriesAll.length;
  const matchedCount = canSearch ? componentEntries.length : totalCount;

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <div className={getClassName({ isExpanded: expanded })}>
      {title && (
        <button
          type="button"
          className={getClassName("title")}
          onClick={() =>
            setUi({
              componentList: {
                ...componentList,
                [id]: {
                  ...componentList[id],
                  expanded: !expanded,
                },
              },
            })
          }
          title={
            expanded
              ? `Collapse${title ? ` ${title}` : ""}`
              : `Expand${title ? ` ${title}` : ""}`
          }
        >
          <div>{title}</div>
          <div className={getClassName("titleIcon")}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        </button>
      )}

      {canSearch ? (
        <div className={getClassName("search")}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && query) {
                event.preventDefault();
                clearSearch();
              }
            }}
            placeholder="Search blocks, e.g. product, heading, image"
            aria-label="Search blocks"
          />

          {query ? (
            <button
              type="button"
              className={getClassName("clearSearch")}
              onClick={clearSearch}
              title="Clear block search"
              aria-label="Clear block search"
            >
              <X size={12} />
            </button>
          ) : null}
        </div>
      ) : null}

      {canSearch ? (
        <div className={getClassName("meta")}>
          {query
            ? `${matchedCount} matching block${matchedCount === 1 ? "" : "s"}`
            : `${totalCount} ready-to-use blocks`}
        </div>
      ) : null}

      <div className={getClassName("content")}>
        <Drawer>
          {children ||
            (canSearch ? componentEntries : componentEntriesAll).map((entry) => {
              return (
                <ComponentListItem
                  key={entry.key}
                  label={entry.label}
                  name={entry.key}
                />
              );
            })}
        </Drawer>

        {canSearch && componentEntries.length === 0 ? (
          <div className={getClassName("empty")}>
            {query
              ? `No blocks match "${query.trim()}". Try words like product, image, text, or section.`
              : "No blocks match your search."}
          </div>
        ) : null}
      </div>
    </div>
  );
};

ComponentList.Item = ComponentListItem;

export { ComponentList };
