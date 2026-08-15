import {
  buildPersistedAppBarProps,
  editorPropsFromPersisted,
  emptyAppBar,
  isEmptyAppBar,
  normalizeSitePageAppBar,
  toEditorAppBarNode,
  toPersistedAppBar,
} from "../app-bar";

describe("app-bar helpers", () => {
  it("treats {} as empty", () => {
    expect(isEmptyAppBar(emptyAppBar())).toBe(true);
    expect(isEmptyAppBar({})).toBe(true);
  });

  it("builds menuAction when showMenu is on", () => {
    const { props } = buildPersistedAppBarProps({
      title: "SOOQ",
      elevation: 0,
      height: 56,
      showMenu: true,
      menuIcon: "menu",
      showNotifications: false,
      showCartIcon: false,
      foregroundColor: "",
      backgroundColor: "",
    });

    expect(props.showMenu).toBe(true);
    expect(props.menuIcon).toBe("menu");
    expect(props.menuAction).toEqual({ type: "openDrawer" });
    expect(props.trailingIcon).toBeUndefined();
  });

  it("builds notifications trailing action", () => {
    const { props, style } = buildPersistedAppBarProps({
      title: "Home",
      elevation: 0,
      height: 56,
      showMenu: false,
      menuIcon: "menu",
      showNotifications: true,
      showCartIcon: false,
      foregroundColor: "#0F172A",
      backgroundColor: "#FFFFFF",
    });

    expect(props.trailingIcon).toBe("notifications");
    expect(props.trailingAction).toEqual({
      type: "navigate",
      route: "/notifications",
      navigation_type: "push",
    });
    expect(props.foregroundColor).toBe("#0F172A");
    expect(style).toEqual({ background: "#FFFFFF" });
  });

  it("builds cart fields when showCartIcon is on", () => {
    const { props } = buildPersistedAppBarProps({
      title: "Product",
      elevation: 0,
      height: 56,
      showMenu: false,
      menuIcon: "menu",
      showNotifications: false,
      showCartIcon: true,
      foregroundColor: "",
      backgroundColor: "",
    });

    expect(props.showCartIcon).toBe(true);
    expect(props.cartBadgePath).toBe("cart.itemCount");
    expect(props.cartAction).toEqual({ type: "navigate", route: "/cart" });
  });

  it("round-trips editor ↔ persisted", () => {
    const persisted = toPersistedAppBar({
      type: "AppBar",
      props: {
        id: "home-appbar",
        title: "SOOQ",
        elevation: 0,
        height: 56,
        showMenu: true,
        menuIcon: "menu",
        showNotifications: true,
        showCartIcon: false,
        foregroundColor: "#0F172A",
        backgroundColor: "#FFFFFF",
      },
    });

    expect(persisted).toMatchObject({
      id: "home-appbar",
      type: "appBar",
      props: {
        title: "SOOQ",
        showMenu: true,
        menuAction: { type: "openDrawer" },
        trailingIcon: "notifications",
      },
      style: { background: "#FFFFFF" },
    });

    const editor = editorPropsFromPersisted(persisted);
    expect(editor?.showMenu).toBe(true);
    expect(editor?.showNotifications).toBe(true);
    expect(editor?.backgroundColor).toBe("#FFFFFF");

    const node = toEditorAppBarNode(persisted);
    expect(node?.type).toBe("AppBar");
    expect(node?.props.title).toBe("SOOQ");
  });

  it("normalizeSitePageAppBar returns {} for empty input", () => {
    expect(normalizeSitePageAppBar(undefined)).toEqual({});
    expect(normalizeSitePageAppBar({})).toEqual({});
    expect(normalizeSitePageAppBar(null)).toEqual({});
  });
});
