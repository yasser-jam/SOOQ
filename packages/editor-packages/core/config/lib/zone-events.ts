export type ZoneEventAction = "open" | "close" | "toggle";

export type ZoneEventDetail = {
  key: string;
  action?: ZoneEventAction;
};

export const SOOQ_ZONE_EVENT = "sooq:zone";

export const dispatchZoneEvent = (
  key: string,
  action: ZoneEventAction = "toggle"
) => {
  if (typeof document === "undefined") return;

  document.dispatchEvent(
    new CustomEvent<ZoneEventDetail>(SOOQ_ZONE_EVENT, {
      detail: { key, action },
    })
  );
};

export const openZone = (key: string) => dispatchZoneEvent(key, "open");
export const closeZone = (key: string) => dispatchZoneEvent(key, "close");
export const toggleZone = (key: string) => dispatchZoneEvent(key, "toggle");

export const ZONE_TOGGLE_ATTR = "data-sooq-zone-toggle";
export const ZONE_ACTION_ATTR = "data-sooq-zone-action";
