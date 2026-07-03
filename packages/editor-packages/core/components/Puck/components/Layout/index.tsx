import { ReactElement, ReactNode, useEffect, useMemo, useState } from "react";
import { getClassNameFactory } from "../../../../lib";
import { IframeConfig, UiState } from "../../../../types";
import { usePropsContext } from "../..";
import styles from "./styles.module.css";
import { useInjectGlobalCss } from "../../../../lib/use-inject-css";
import { useAppStore, useAppStoreApi } from "../../../../store";
import { DefaultOverride } from "../../../DefaultOverride";
import { monitorHotkeys, useMonitorHotkeys } from "../../../../lib/use-hotkey";
import { getFrame } from "../../../../lib/get-frame";
import { usePreviewModeHotkeys } from "../../../../lib/use-preview-mode-hotkeys";
import { DragDropContext } from "../../../DragDropContext";
import { Header } from "../Header";
import { SidebarSection } from "../../../SidebarSection";
import { Canvas } from "../Canvas";
import { Fields } from "../Fields";
import { useSidebarResize } from "../../../../lib/use-sidebar-resize";
import { FrameProvider } from "../../../../lib/frame-context";
import { Sidebar } from "../Sidebar";
import { useDeleteHotkeys } from "../../../../lib/use-delete-hotkeys";
import { MenuItem, Nav } from "../Nav";
import { IconButton } from "../../../IconButton";
import { Maximize2, Minimize2, ToyBrick } from "lucide-react";
import { PluginInternal } from "../../../../types/Internal";
import { blocksPlugin } from "../../../../plugins/blocks";
import { outlinePlugin } from "../../../../plugins/outline";
import { fieldsPlugin } from "../../../../plugins/fields";

const getClassName = getClassNameFactory("Puck", styles);
const getLayoutClassName = getClassNameFactory("PuckLayout", styles);
const getPluginTabClassName = getClassNameFactory("PuckPluginTab", styles);

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tagName = target.tagName;
  return (
    tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT"
  );
};

const pluginTitleMap: Record<string, string> = {
  blocks: "البلوكات",
  block: "البلوكات",
  outline: "المخطط",
  fields: "الخصائص",
  "legacy-side-bar": "الشريط الجانبي",
};

// Todo: remove
// const translatePluginTitle = (label: string, pluginName: string): string => {
//   const normalizedLabel = label.trim().toLowerCase();
//   const normalizedName = pluginName.trim().toLowerCase();

//   if (pluginTitleMap[normalizedLabel]) {
//     return pluginTitleMap[normalizedLabel];
//   }

//   if (pluginTitleMap[normalizedName]) {
//     return pluginTitleMap[normalizedName];
//   }

//   return label;
// };

const FieldSideBar = () => {
  const selectedItem = useAppStore((s) => s.selectedItem);
  const title = useAppStore((s) => {
    const item = s.selectedItem;
    if (!item) return "";

    return s.config.components[item.type]?.["label"] ?? item.type.toString();
  });

  if (!selectedItem) {
    return null;
  }

  return (
    <SidebarSection noBorderTop showBreadcrumbs title={title}>
      <Fields />
    </SidebarSection>
  );
};

const PluginTab = ({
  children,
  visible,
  mobileOnly,
}: {
  children: ReactNode;
  visible: boolean;
  mobileOnly?: boolean;
}) => {
  return (
    <div className={getPluginTabClassName({ visible, mobileOnly })}>
      <div className={getPluginTabClassName("body")}>{children}</div>
    </div>
  );
};

export const Layout = ({ children }: { children?: ReactNode }) => {
  const {
    iframe: _iframe,
    dnd,
    initialHistory: _initialHistory,
    plugins,
    height,
    builtinPlugins,
  } = usePropsContext();

  const iframe: IframeConfig = useMemo(
    () => ({
      enabled: true,
      waitForStyles: true,
      ..._iframe,
    }),
    [_iframe]
  );

  useInjectGlobalCss(iframe.enabled);

  const dispatch = useAppStore((s) => s.dispatch);
  const leftSideBarVisible = useAppStore((s) => s.state.ui.leftSideBarVisible);
  const rightSideBarVisible = useAppStore(
    (s) => s.state.ui.rightSideBarVisible
  );

  const instanceId = useAppStore((s) => s.instanceId);

  const {
    width: leftWidth,
    setWidth: setLeftWidth,
    sidebarRef: leftSidebarRef,
    handleResizeEnd: handleLeftSidebarResizeEnd,
  } = useSidebarResize("left", dispatch);

  const {
    width: rightWidth,
    setWidth: setRightWidth,
    sidebarRef: rightSidebarRef,
    handleResizeEnd: handleRightSidebarResizeEnd,
  } = useSidebarResize("right", dispatch);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 638px)").matches) {
      dispatch({
        type: "setUi",
        ui: {
          leftSideBarVisible: false,
          rightSideBarVisible: false,
        },
      });
    }

    const handleResize = () => {
      if (!window.matchMedia("(min-width: 638px)").matches) {
        dispatch({
          type: "setUi",
          ui: (ui: UiState) => ({
            ...ui,
            ...(ui.rightSideBarVisible ? { leftSideBarVisible: false } : {}),
          }),
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const overrides = useAppStore((s) => s.overrides);

  const CustomPuck = useMemo(
    () => overrides.puck || DefaultOverride,
    [overrides]
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ready = useAppStore((s) => s.status === "READY");

  useMonitorHotkeys();

  useEffect(() => {
    if (ready && iframe.enabled) {
      const frameDoc = getFrame();

      if (frameDoc) {
        return monitorHotkeys(frameDoc);
      }
    }
  }, [ready, iframe.enabled]);

  usePreviewModeHotkeys();
  useDeleteHotkeys();

  const layoutOptions: Record<string, any> = {};

  if (leftWidth) {
    layoutOptions["--puck-user-left-side-bar-width"] = `${leftWidth}px`;
  }

  if (rightWidth) {
    layoutOptions["--puck-user-right-side-bar-width"] = `${rightWidth}px`;
  }

  const setUi = useAppStore((s) => s.setUi);
  const currentPlugin = useAppStore((s) => s.state.ui.plugin?.current);
  const selectedItem = useAppStore((s) => s.selectedItem);
  const appStoreApi = useAppStoreApi();

  const [mobilePanelHeightMode, setMobilePanelHeightMode] = useState<
    "toggle" | "min-content"
  >("toggle");

  const hasLegacySideBarPlugin = useMemo(
    () => !!plugins?.find((p) => p.name === "legacy-side-bar"),
    [plugins]
  );

  const pluginItems = useMemo(() => {
    const details: Record<string, MenuItem & { render: () => ReactElement }> =
      {};

    const enabledBuiltins = builtinPlugins ?? ["blocks", "outline"];
    const defaultPlugins: PluginInternal[] = enabledBuiltins.map((name) =>
      name === "blocks" ? blocksPlugin() : outlinePlugin()
    );

    const isLegacy = (plugin: PluginInternal) =>
      plugin.name === "legacy-side-bar" ? -1 : 0;

    // Always place legacy-side-bar first
    // Stable tie-break ensures consistent order for non-legacy plugins
    const combinedPlugins: PluginInternal[] = [
      ...defaultPlugins,
      ...(plugins ?? []),
    ].sort((a, b) => isLegacy(a) - isLegacy(b));

    if (!plugins?.some((p) => p.name === "fields")) {
      combinedPlugins.push(fieldsPlugin());
    }

    combinedPlugins?.forEach((plugin) => {

      if (plugin.name && plugin.render) {
        if (details[plugin.name]) {
          // Delete existing plugins with this name to enable user sorting
          delete details[plugin.name];
        }

        details[plugin.name] = {
          label: plugin.label || '',
          icon: plugin.icon ?? <ToyBrick />,
          onClick: () => {
            setMobilePanelHeightMode(plugin.mobilePanelHeight ?? "toggle");

            if (plugin.name === currentPlugin) {
              if (leftSideBarVisible) {
                setUi({ leftSideBarVisible: false });
              } else {
                setUi({ leftSideBarVisible: true });
              }
            } else {
              if (plugin.name) {
                setUi({
                  plugin: { current: plugin.name },
                  leftSideBarVisible: true,
                });
              }
            }
          },
          isActive: leftSideBarVisible && currentPlugin === plugin.name,
          render: plugin.render,
          mobileOnly: hasLegacySideBarPlugin || plugin.mobileOnly,
          desktopOnly: plugin.name === "legacy-side-bar" || plugin.desktopOnly,
        };
      }
    });

    return details;
  }, [plugins, builtinPlugins, currentPlugin, appStoreApi, leftSideBarVisible]);

  useEffect(() => {
    if (!currentPlugin) {
      const names = Object.keys(pluginItems);

      setUi({ plugin: { current: names[0] } });
    }
  }, [pluginItems, currentPlugin]);

  const hasDesktopFieldsPlugin =
    pluginItems["fields"] && pluginItems["fields"].mobileOnly === false;

  const mobilePanelExpanded = useAppStore(
    (s) => s.state.ui.mobilePanelExpanded ?? false
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (!event.ctrlKey && !event.metaKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "\\") {
        event.preventDefault();
        setUi({ leftSideBarVisible: !leftSideBarVisible });
        return;
      }

      if (event.key !== "]" && event.key !== "[") return;

      const pluginNames = Object.keys(pluginItems);
      if (pluginNames.length === 0) return;

      const currentIndex = Math.max(
        0,
        pluginNames.indexOf(currentPlugin ?? pluginNames[0])
      );
      const nextIndex =
        event.key === "]"
          ? (currentIndex + 1) % pluginNames.length
          : (currentIndex - 1 + pluginNames.length) % pluginNames.length;

      const nextPlugin = pluginNames[nextIndex];

      event.preventDefault();
      setUi({
        plugin: { current: nextPlugin },
        leftSideBarVisible: true,
      });
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [currentPlugin, leftSideBarVisible, pluginItems, setUi]);

  return (
    <div
      className={`Puck ${getClassName({
        hidePlugins: hasLegacySideBarPlugin,
      })}`}
      dir="rtl"
      id={instanceId}
      style={{ height }}
    >
      <DragDropContext disableAutoScroll={dnd?.disableAutoScroll}>
        <CustomPuck>
          {children || (
            <FrameProvider>
              <div
                className={getLayoutClassName({
                  leftSideBarVisible,
                  mounted,
                  rightSideBarVisible:
                    !hasDesktopFieldsPlugin &&
                    rightSideBarVisible &&
                    !!selectedItem,
                  isExpanded: mobilePanelExpanded,
                  mobilePanelHeightToggle: mobilePanelHeightMode === "toggle",
                  mobilePanelHeightMinContent:
                    mobilePanelHeightMode === "min-content",
                })}
                style={{ height }}
              >
                <div
                  className={getLayoutClassName("inner")}
                  style={layoutOptions}
                >
                  <div className={getLayoutClassName("header")}>
                    <Header hidePlugins={false} />
                  </div>
                  <div className={getLayoutClassName("nav")}>
                    <Nav
                      items={pluginItems}
                      mobileActions={
                        leftSideBarVisible &&
                        mobilePanelHeightMode === "toggle" && (
                          <IconButton
                            type="button"
                            title="maximize"
                            onClick={() => {
                              setUi({
                                mobilePanelExpanded: !mobilePanelExpanded,
                              });
                            }}
                          >
                            {mobilePanelExpanded ? (
                              <Minimize2 size={21} />
                            ) : (
                              <Maximize2 size={21} />
                            )}
                          </IconButton>
                        )
                      }
                    />
                  </div>
                  <Sidebar
                    position="left"
                    sidebarRef={leftSidebarRef}
                    isVisible={leftSideBarVisible}
                    onResize={setLeftWidth}
                    onResizeEnd={handleLeftSidebarResizeEnd}
                  >
                    {Object.entries(pluginItems).map(
                      ([id, { mobileOnly, render: Render, label }]) => (
                        <PluginTab
                          key={id}
                          visible={currentPlugin === id}
                          mobileOnly={mobileOnly}
                        >
                          <Render />
                        </PluginTab>
                      )
                    )}
                  </Sidebar>
                  <Canvas />
                  {!hasDesktopFieldsPlugin && (
                    <Sidebar
                      position="right"
                      sidebarRef={rightSidebarRef}
                      isVisible={rightSideBarVisible && !!selectedItem}
                      onResize={setRightWidth}
                      onResizeEnd={handleRightSidebarResizeEnd}
                    >
                      <FieldSideBar />
                    </Sidebar>
                  )}
                </div>
              </div>
            </FrameProvider>
          )}
        </CustomPuck>
      </DragDropContext>
      <div id="puck-portal-root" className={getClassName("portal")} />
    </div>
  );
};
