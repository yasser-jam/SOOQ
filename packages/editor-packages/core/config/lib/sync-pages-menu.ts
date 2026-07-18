import { walkAppState } from "../../lib/data/walk-app-state";
import { generateId } from "../../lib/generate-id";
import type { useAppStoreApi } from "../../store";
import type { Content, Data } from "../../types";
import type { PrivateAppState } from "../../types/Internal";
import {
  PAGES_MENU_MARKER,
  buildPagesMenuContentLinks,
  getPageLinkId,
  type PagesMenuStyleVariant,
} from "../presets/pages-menu";
import { getAllPages, type PageDefinition } from "../pages";
type AppStoreApi = ReturnType<typeof useAppStoreApi>;

type ContentLinkItem = Content[number];

function isPagesMenuGroup(node: { data: { type: string; props?: Record<string, unknown> } }) {
  return (
    node.data.type === "Group" &&
    node.data.props?.[PAGES_MENU_MARKER] === true
  );
}

function getLinkPageId(link: ContentLinkItem): string | null {
  const linkValue = link.props?.link as { kind?: string; pageId?: string } | undefined;
  if (linkValue?.kind !== "page" || typeof linkValue.pageId !== "string") {
    return null;
  }
  return linkValue.pageId;
}

function inferStyleVariant(groupProps: Record<string, unknown>): PagesMenuStyleVariant {
  return groupProps.direction === "column" ? "drawer-vertical" : "header-horizontal";
}

function createLinkForPage(
  page: PageDefinition,
  styleVariant: PagesMenuStyleVariant,
  templateLink?: ContentLinkItem
) {
  const baseLink = buildPagesMenuContentLinks([page], styleVariant)[0]!;
  const templateProps = templateLink?.props ?? {};

  return {
    ...baseLink,
    props: {
      ...baseLink.props,
      id: generateId("ContentLink"),
      color: templateProps.color ?? baseLink.props.color,
      hoverColor: templateProps.hoverColor ?? baseLink.props.hoverColor,
      hoverEffect: templateProps.hoverEffect ?? baseLink.props.hoverEffect,
      fontSize: templateProps.fontSize ?? baseLink.props.fontSize,
      align: templateProps.align ?? baseLink.props.align,
      icon: templateProps.icon ?? baseLink.props.icon,
      iconPosition: templateProps.iconPosition ?? baseLink.props.iconPosition,
    },
  };
}

function buildSyncedLinks(
  pages: PageDefinition[],
  currentLinks: Content,
  styleVariant: PagesMenuStyleVariant
): Content {
  const linkByPageId = new Map<string, ContentLinkItem>();

  currentLinks.forEach((item) => {
    if (item.type !== "ContentLink") return;
    const pageId = getLinkPageId(item);
    if (pageId) linkByPageId.set(pageId, item);
  });

  const templateLink = currentLinks.find((item) => item.type === "ContentLink");

  return pages.map((page) => {
    const pageId = getPageLinkId(page);
    const existing = linkByPageId.get(pageId);
    if (existing) return existing;
    return createLinkForPage(page, styleVariant, templateLink);
  });
}

function linksChanged(before: Content, after: Content): boolean {
  if (before.length !== after.length) return true;

  return before.some((item, index) => {
    const next = after[index];
    if (!next) return true;
    if (item.props?.id !== next.props?.id) return true;

    const beforePageId = getLinkPageId(item);
    const afterPageId = getLinkPageId(next);
    return beforePageId !== afterPageId;
  });
}

function findPagesMenuGroupIds(state: PrivateAppState<Data>): string[] {
  return Object.entries(state.indexes.nodes)
    .filter(([, node]) => isPagesMenuGroup(node))
    .map(([id]) => id);
}

/** Sync pages-menu Groups in site zones when pages are added or removed. */
export function syncPagesMenuZones(appStoreApi: AppStoreApi): boolean {
  const { config, dispatch, state } = appStoreApi.getState();
  const groupIds = findPagesMenuGroupIds(state);

  if (groupIds.length === 0) return false;

  const pages = getAllPages();
  let nextZones = { ...(state.data.zones ?? {}) };
  let changed = false;

  groupIds.forEach((groupId) => {
    const zoneKey = `${groupId}:content`;
    const currentLinks = nextZones[zoneKey] ?? [];
    const groupNode = state.indexes.nodes[groupId];
    const groupProps = (groupNode?.data.props ?? {}) as Record<string, unknown>;
    const styleVariant = inferStyleVariant(groupProps);
    const syncedLinks = buildSyncedLinks(pages, currentLinks, styleVariant);

    if (!linksChanged(currentLinks, syncedLinks)) return;

    nextZones = { ...nextZones, [zoneKey]: syncedLinks };
    changed = true;
  });

  if (!changed) return false;

  const walked = walkAppState(
    { ...state, data: { ...state.data, zones: nextZones } },
    config
  );

  dispatch({
    type: "set",
    state: walked,
    recordHistory: false,
  });

  return true;
}
