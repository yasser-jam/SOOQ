/**
 * Per-page AppBar helpers — editor block (`AppBar`) ↔ persisted page field
 * (`appBar` with Flutter-facing `type: "appBar"`).
 */

type JsonRecord = Record<string, unknown>;

export type AppBarMenuAction = { type: "openDrawer" };

export type AppBarNavigateAction = {
  type: "navigate";
  route: string;
  navigation_type?: string;
};

export type AppBarPersistedProps = {
  title?: string;
  elevation?: number;
  height?: number;
  showMenu?: boolean;
  menuIcon?: string;
  menuAction?: AppBarMenuAction;
  trailingIcon?: string;
  trailingAction?: AppBarNavigateAction;
  showCartIcon?: boolean;
  cartBadgePath?: string;
  cartAction?: AppBarNavigateAction;
  foregroundColor?: string;
};

/** Empty `{}` when the page has no app bar. */
export type SitePageAppBar =
  | Record<string, never>
  | {
      id: string;
      type: "appBar";
      props: AppBarPersistedProps;
      style?: { background?: string };
    };

/** Editor-facing props stored on the Puck `AppBar` block. */
export type AppBarEditorProps = {
  id?: string;
  title: string;
  elevation: number;
  height: number;
  showMenu: boolean;
  menuIcon: string;
  showNotifications: boolean;
  showCartIcon: boolean;
  foregroundColor: string;
  backgroundColor: string;
};

const isPlainObject = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function isEmptyAppBar(
  value: SitePageAppBar | null | undefined
): boolean {
  return !value || Object.keys(value).length === 0;
}

export function emptyAppBar(): SitePageAppBar {
  return {};
}

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const readString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const readBool = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

/** Build persisted props (+ style) from editor switches. */
export function buildPersistedAppBarProps(
  editor: Partial<AppBarEditorProps> & JsonRecord
): { props: AppBarPersistedProps; style?: { background: string } } {
  const title = readString(editor.title, "");
  const elevation = readNumber(editor.elevation, 0);
  const height = readNumber(editor.height, 56);
  const showMenu = readBool(editor.showMenu, false);
  const menuIcon = readString(editor.menuIcon, "menu") || "menu";
  const showNotifications = readBool(editor.showNotifications, false);
  const showCartIcon = readBool(editor.showCartIcon, false);
  const foregroundColor = readString(editor.foregroundColor, "");
  const backgroundColor = readString(editor.backgroundColor, "");

  const props: AppBarPersistedProps = {
    title,
    elevation,
    height,
  };

  if (showMenu) {
    props.showMenu = true;
    props.menuIcon = menuIcon;
    props.menuAction = { type: "openDrawer" };
  }

  if (showNotifications) {
    props.trailingIcon = "notifications";
    props.trailingAction = {
      type: "navigate",
      route: "/notifications",
      navigation_type: "push",
    };
  }

  if (showCartIcon) {
    props.showCartIcon = true;
    props.cartBadgePath = "cart.itemCount";
    props.cartAction = { type: "navigate", route: "/cart" };
  }

  if (foregroundColor) {
    props.foregroundColor = foregroundColor;
  }

  const style = backgroundColor
    ? { background: backgroundColor }
    : undefined;

  return { props, style };
}

export function editorPropsFromPersisted(
  appBar: SitePageAppBar
): AppBarEditorProps | null {
  if (isEmptyAppBar(appBar) || !("props" in appBar)) return null;

  const props = appBar.props ?? {};
  const style = "style" in appBar ? appBar.style : undefined;

  const showNotifications =
    props.trailingIcon === "notifications" ||
    (props.trailingAction?.type === "navigate" &&
      props.trailingAction.route === "/notifications");

  return {
    id: appBar.id,
    title: readString(props.title, ""),
    elevation: readNumber(props.elevation, 0),
    height: readNumber(props.height, 56),
    showMenu: readBool(props.showMenu, Boolean(props.menuAction)),
    menuIcon: readString(props.menuIcon, "menu") || "menu",
    showNotifications: Boolean(showNotifications),
    showCartIcon: readBool(props.showCartIcon, false),
    foregroundColor: readString(props.foregroundColor, ""),
    backgroundColor: readString(style?.background, ""),
  };
}

export function toPersistedAppBar(
  node: { type?: string; props?: JsonRecord } | null | undefined
): SitePageAppBar {
  if (!node || !isPlainObject(node.props)) return emptyAppBar();

  const id =
    readString(node.props.id, "") ||
    `appbar-${Math.random().toString(36).slice(2, 9)}`;
  const { props, style } = buildPersistedAppBarProps(node.props);

  return {
    id,
    type: "appBar",
    props,
    ...(style ? { style } : {}),
  };
}

/** Convert persisted page.appBar → Puck `AppBar` content node. */
export function toEditorAppBarNode(
  appBar: SitePageAppBar
): { type: "AppBar"; props: AppBarEditorProps & { id: string } } | null {
  const editor = editorPropsFromPersisted(appBar);
  if (!editor) return null;

  const id = editor.id || `AppBar-${Math.random().toString(36).slice(2, 9)}`;
  return {
    type: "AppBar",
    props: { ...editor, id },
  };
}

export function normalizeSitePageAppBar(value: unknown): SitePageAppBar {
  if (!isPlainObject(value) || Object.keys(value).length === 0) {
    return emptyAppBar();
  }

  // Already empty-ish or wrong shape → empty
  if (value.type && value.type !== "appBar" && value.type !== "AppBar") {
    return emptyAppBar();
  }

  const props = isPlainObject(value.props) ? value.props : value;
  const id = readString(value.id, "") || "appbar";
  const style = isPlainObject(value.style)
    ? (value.style as { background?: string })
    : undefined;

  // Accept either editor-shaped or persisted-shaped props
  const editorLike: JsonRecord = {
    ...props,
    backgroundColor:
      props.backgroundColor ??
      style?.background ??
      props.backgroundColor,
    showNotifications:
      props.showNotifications ??
      (props.trailingIcon === "notifications" ||
        (isPlainObject(props.trailingAction) &&
          props.trailingAction.route === "/notifications")),
  };

  const { props: nextProps, style: nextStyle } =
    buildPersistedAppBarProps(editorLike);

  return {
    id,
    type: "appBar",
    props: nextProps,
    ...(nextStyle
      ? { style: nextStyle }
      : style?.background
        ? { style: { background: style.background } }
        : {}),
  };
}
