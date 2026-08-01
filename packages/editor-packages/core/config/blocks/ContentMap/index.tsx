"use client";

import React, { useCallback } from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import { useStore } from "../../store-context";
import { ContentMapClient } from "./ContentMapClient";
import { DAMASCUS_CENTER } from "./leaflet-config";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ContentMap", styles);

export type ContentMapAction = "" | "address_draft_location";

export type ContentMapProps = WithLayout<{
  heightPx: number;
  zoom: number;
  defaultLat: number;
  defaultLng: number;
  interactive: boolean;
  mapAction: ContentMapAction;
}>;

type BoundAddressDraftMapProps = {
  heightPx: number;
  zoom: number;
  defaultLat: number;
  defaultLng: number;
  interactive: boolean;
};

/**
 * Isolated subscriber for address-draft coords so the Leaflet map keeps a
 * stable component identity while sibling inputs update the store.
 */
function BoundAddressDraftMap({
  heightPx,
  zoom,
  defaultLat,
  defaultLng,
  interactive,
}: BoundAddressDraftMapProps) {
  const { customer, actions } = useStore();
  const onLocationChange = useCallback(
    (latitude: number, longitude: number) => {
      actions.customer.setAddressDraftLocation(latitude, longitude);
    },
    [actions.customer]
  );

  return (
    <ContentMapClient
      heightPx={heightPx}
      zoom={zoom}
      defaultLat={defaultLat}
      defaultLng={defaultLng}
      interactive={interactive}
      latitude={customer.addressDraft.latitude}
      longitude={customer.addressDraft.longitude}
      onLocationChange={onLocationChange}
    />
  );
}

const ContentMapInner: ComponentConfig<ContentMapProps> = {
  label: "خريطة",

  fields: {
    heightPx: { type: "number", label: "الارتفاع (بكسل)" },
    zoom: { type: "number", label: "التكبير" },
    defaultLat: { type: "number", label: "خط العرض الافتراضي" },
    defaultLng: { type: "number", label: "خط الطول الافتراضي" },
    interactive: {
      type: "radio",
      label: "تفاعلية",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    mapAction: {
      type: "select",
      label: "الإجراء",
      options: [
        { label: "بدون", value: "" },
        { label: "موقع العنوان الجديد", value: "address_draft_location" },
      ],
    },
  },

  defaultProps: {
    heightPx: 260,
    zoom: 13,
    defaultLat: DAMASCUS_CENTER.lat,
    defaultLng: DAMASCUS_CENTER.lng,
    interactive: true,
    mapAction: "",
  },

  render: ({
    heightPx,
    zoom,
    defaultLat,
    defaultLng,
    interactive,
    mapAction,
    puck,
  }) => {
    const isAddressDraftLocation = mapAction === "address_draft_location";

    if (puck.isEditing || typeof window === "undefined") {
      return (
        <div
          className={getClassName("placeholder")}
          style={{ height: heightPx }}
        >
          الخريطة تظهر في المتجر المنشور
        </div>
      );
    }

    return (
      <div className={getClassName()}>
        {isAddressDraftLocation ? (
          <BoundAddressDraftMap
            heightPx={heightPx}
            zoom={zoom}
            defaultLat={defaultLat}
            defaultLng={defaultLng}
            interactive={interactive}
          />
        ) : (
          <ContentMapClient
            heightPx={heightPx}
            zoom={zoom}
            defaultLat={defaultLat}
            defaultLng={defaultLng}
            interactive={interactive}
            latitude={null}
            longitude={null}
            onLocationChange={() => {}}
          />
        )}
      </div>
    );
  },
};

export const ContentMap = withLayout(ContentMapInner);
