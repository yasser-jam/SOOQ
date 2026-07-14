"use client";
import { Loader } from "../../../Loader";
import { rootDroppableId } from "../../../../lib/root-droppable-id";
import { ItemSelector } from "../../../../lib/data/get-item";
import { getSelectorForId } from "../../../../lib/get-selector-for-id";
import { UiState } from "../../../../types";
import { AutoFieldPrivate } from "../../../AutoField";
import { fieldContextStore } from "../../../AutoField/store";
import { AppStore, useAppStore, useAppStoreApi } from "../../../../store";
import styles from "./styles.module.css";
import { getClassNameFactory } from "../../../../lib";
import {
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRegisterFieldsSlice } from "../../../../store/slices/fields";
import { useShallow } from "zustand/react/shallow";
import { StoreApi } from "zustand";
import {
  AlignRight,
  LayoutPanelTop,
  Palette,
  Settings2,
  SquareDashed,
  Type,
} from "lucide-react";
import {
  FIELD_GROUP_COLORS,
  FIELD_GROUP_LABELS,
  FIELD_GROUP_ORDER,
  groupFieldNames,
  type FieldGroup,
} from "./field-groups";

const FIELD_GROUP_ICONS: Record<FieldGroup, ReactNode> = {
  content: <AlignRight size={15} />,
  layout: <LayoutPanelTop size={15} />,
  background: <Palette size={15} />,
  typography: <Type size={15} />,
  border: <SquareDashed size={15} />,
  advanced: <Settings2 size={15} />,
};

const getClassName = getClassNameFactory("PuckFields", styles);

const DefaultFields = ({
  children,
}: {
  children: ReactNode;
  isLoading: boolean;
  itemSelector?: ItemSelector | null;
}) => {
  return <>{children}</>;
};

const createOnChange =
  (fieldName: string, appStore: StoreApi<AppStore>) =>
  async (value: any, updatedUi?: Partial<UiState>) => {
    const { dispatch, state, selectedItem, resolveComponentData } =
      appStore.getState();

    const { data, ui } = state;
    const { itemSelector } = ui;

    // DEPRECATED: root without props object
    const rootProps = data.root.props || data.root;
    const currentProps = selectedItem ? selectedItem.props : rootProps;

    const newProps = { ...currentProps, [fieldName]: value };

    if (selectedItem && itemSelector) {
      const resolved = await resolveComponentData(
        { ...selectedItem, props: newProps },
        "replace"
      );

      const latestSelector = getSelectorForId(
        appStore.getState().state,
        selectedItem.props.id
      );
      if (!latestSelector) return;

      dispatch({
        type: "replace",
        destinationIndex: latestSelector.index,
        destinationZone: latestSelector.zone || rootDroppableId,
        data: resolved.node,
        ui: updatedUi,
      });

      return;
    }

    if (data.root.props) {
      dispatch({
        type: "replaceRoot",
        root: (
          await resolveComponentData(
            { ...data.root, props: newProps },
            "replace"
          )
        ).node,
        ui: { ...ui, ...updatedUi },
        recordHistory: true,
      });

      return;
    }

    // DEPRECATED: root without props object
    dispatch({
      type: "setData",
      data: { root: newProps },
    });
  };

const FieldsChildInner = ({ fieldName }: { fieldName: string }) => {
  const field = useAppStore((s) => s.fields.fields[fieldName]);
  const isReadOnly = useAppStore(
    (s) =>
      ((s.selectedItem
        ? s.selectedItem.readOnly
        : s.state.data.root.readOnly) || {})[fieldName]
  );

  const id = useAppStore((s) => {
    if (!field) return null;

    return s.selectedItem
      ? `${s.selectedItem.props.id}_${field.type}_${fieldName}`
      : `root_${field.type}_${fieldName}`;
  });

  const permissions = useAppStore(
    useShallow((s) => {
      const { selectedItem, permissions } = s;

      return selectedItem
        ? permissions.getPermissions({ item: selectedItem })
        : permissions.getPermissions({ root: true });
    })
  );

  const appStore = useAppStoreApi();

  const onChange = useCallback(createOnChange(fieldName, appStore), [
    fieldName,
  ]);

  const { visible = true } = field ?? {};

  const fieldStore = useContext(fieldContextStore.ctx);

  useEffect(() => {
    return appStore.subscribe(
      (s) => {
        const data = s.getCurrentData();

        return data.props?.[fieldName];
      },
      (value) => {
        fieldStore.setState({ [fieldName]: value });
      }
    );
  }, [appStore, fieldStore]);

  if (!field || !id || !visible) return null;

  if (field.type === "slot") return null;

  return (
    <div key={id} className={getClassName("field")}>
      <AutoFieldPrivate
        field={field}
        name={fieldName}
        id={id}
        readOnly={!permissions.edit || isReadOnly}
        onChange={onChange}
      />
    </div>
  );
};

const FieldsChild = ({ fieldName }: { fieldName: string }) => {
  const appStore = useAppStoreApi();

  const initialValue = useMemo(() => {
    const value = appStore.getState().getCurrentData().props?.[fieldName];

    return { [fieldName]: value };
  }, []);

  return (
    <fieldContextStore.Provider value={initialValue}>
      <FieldsChildInner fieldName={fieldName} />
    </fieldContextStore.Provider>
  );
};

const FieldsChildMemo = memo(FieldsChild);

/**
 * D-3: sticky panel header — the selected block's label plus a clickable
 * breadcrumb of its parents, so deep selections stop being disorienting.
 * Subscribes via a JSON snapshot so unrelated store changes don't re-render it.
 */
const FieldsHeader = () => {
  const appStore = useAppStoreApi();

  const snapshot = useAppStore((s) => {
    const item = s.selectedItem;
    if (!item) return "";

    const nodes = s.state.indexes.nodes;
    const labelOf = (type: string, props: unknown) => {
      const custom = (props as { name?: string } | undefined)?.name?.trim();
      return (
        custom ||
        (s.config.components[type] as { label?: string } | undefined)?.label ||
        type
      );
    };

    const crumbs: Array<{ id: string; label: string }> = [];
    let parentId = nodes[item.props.id]?.parentId;
    while (parentId && parentId !== "root") {
      const parent = nodes[parentId];
      if (!parent) break;
      crumbs.unshift({
        id: parentId,
        label: labelOf(parent.data.type, parent.data.props),
      });
      parentId = parent.parentId;
    }

    return JSON.stringify({
      label: labelOf(item.type, item.props),
      crumbs,
    });
  });

  const parsed = useMemo(
    () =>
      snapshot
        ? (JSON.parse(snapshot) as {
            label: string;
            crumbs: Array<{ id: string; label: string }>;
          })
        : null,
    [snapshot]
  );

  const selectCrumb = useCallback(
    (crumbId: string) => {
      const { state, dispatch } = appStore.getState();
      const selector = getSelectorForId(state, crumbId);
      if (!selector) return;
      dispatch({ type: "setUi", ui: { itemSelector: selector } });
    },
    [appStore]
  );

  if (!parsed) return null;

  return (
    <div className={getClassName("header")} dir="rtl">
      {parsed.crumbs.length > 0 && (
        <div className={getClassName("breadcrumbs")}>
          {parsed.crumbs.map((crumb) => (
            <button
              key={crumb.id}
              type="button"
              className={getClassName("breadcrumb")}
              onClick={() => selectCrumb(crumb.id)}
              title={crumb.label}
            >
              {crumb.label}
            </button>
          ))}
        </div>
      )}
      <div className={getClassName("headerTitle")}>{parsed.label}</div>
    </div>
  );
};

const FieldsInternal = ({ wrapFields = true }: { wrapFields?: boolean }) => {
  const overrides = useAppStore((s) => s.overrides);
  const selectedItem = useAppStore((s) => s.selectedItem);
  const componentResolving = useAppStore((s) => {
    const loadingCount = s.selectedItem
      ? s.componentState[s.selectedItem.props.id]?.loadingCount
      : s.componentState["root"]?.loadingCount;

    return (loadingCount ?? 0) > 0;
  });
  const itemSelector = useAppStore(useShallow((s) => s.state.ui.itemSelector));
  const id = useAppStore((s) => s.selectedItem?.props.id);
  const appStore = useAppStoreApi();
  useRegisterFieldsSlice(appStore, id);

  const fieldsLoading = useAppStore((s) => s.fields.loading);
  // Object identity of the fields slice is stable per registration, so the
  // grouping memo below only recomputes when the selection's fields change.
  const fieldsMap = useAppStore((s) =>
    s.fields.id === id ? s.fields.fields : null
  );

  const grouped = useMemo(
    () => groupFieldNames(fieldsMap ?? {}),
    [fieldsMap]
  );

  const nonEmptyGroups = useMemo(
    () => FIELD_GROUP_ORDER.filter((group) => grouped[group].length > 0),
    [grouped]
  );

  const [activeGroup, setActiveGroup] = useState<FieldGroup>("content");

  // Reset the tab when the selection changes — land on the first tab that
  // actually has fields.
  useEffect(() => {
    setActiveGroup(
      grouped.content.length > 0 ? "content" : nonEmptyGroups[0] ?? "content"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showTabs = nonEmptyGroups.length > 1;
  const resolvedGroup = nonEmptyGroups.includes(activeGroup)
    ? activeGroup
    : nonEmptyGroups[0] ?? "content";
  const visibleNames = showTabs
    ? grouped[resolvedGroup]
    : nonEmptyGroups.flatMap((group) => grouped[group]);

  const isLoading = fieldsLoading || componentResolving;

  const Wrapper = useMemo(() => overrides.fields || DefaultFields, [overrides]);

  if (!selectedItem) {
    return null;
  }

  return (
    <form
      className={getClassName({ wrapFields })}
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <FieldsHeader />
      {showTabs && (
        <div className={getClassName("tabs")} role="tablist" dir="rtl">
          {nonEmptyGroups.map((group) => (
            <button
              key={group}
              type="button"
              role="tab"
              aria-selected={group === activeGroup}
              title={FIELD_GROUP_LABELS[group]}
              className={`${getClassName("tab")} ${
                group === activeGroup ? getClassName("tab--active") : ""
              }`.trim()}
              style={
                {
                  "--tab-color": FIELD_GROUP_COLORS[group].color,
                } as React.CSSProperties
              }
              onClick={() => setActiveGroup(group)}
            >
              <span className={getClassName("tabIcon")}>
                {FIELD_GROUP_ICONS[group]}
              </span>
              <span className={getClassName("tabLabel")}>
                {FIELD_GROUP_LABELS[group]}
              </span>
            </button>
          ))}
        </div>
      )}
      {showTabs && (
        <div
          className={getClassName("paneHead")}
          dir="rtl"
          style={
            {
              "--pane-tint": FIELD_GROUP_COLORS[resolvedGroup].tint,
              "--pane-color": FIELD_GROUP_COLORS[resolvedGroup].color,
            } as React.CSSProperties
          }
        >
          <span className={getClassName("paneHeadIcon")}>
            {FIELD_GROUP_ICONS[resolvedGroup]}
          </span>
          <span className={getClassName("paneHeadLabel")}>
            {FIELD_GROUP_LABELS[resolvedGroup]}
          </span>
        </div>
      )}
      <Wrapper isLoading={isLoading} itemSelector={itemSelector}>
        {visibleNames.map((fieldName) => (
          <FieldsChildMemo key={fieldName} fieldName={fieldName} />
        ))}
      </Wrapper>
      {isLoading && (
        <div className={getClassName("loadingOverlay")}>
          <div className={getClassName("loadingOverlayInner")}>
            <Loader size={16} />
          </div>
        </div>
      )}
    </form>
  );
};

export const Fields = memo(FieldsInternal);
