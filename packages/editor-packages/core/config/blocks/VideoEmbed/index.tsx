import React from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout, omitLayoutField } from "../../components/Layout";
import { RADIUS_OPTIONS, resolveRadius } from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { toYouTubeEmbedUrl } from "../../content/youtube";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export type VideoEmbedProps = WithLayout<{
  src: string;
  align: "left" | "center" | "right";
  size: string;
  radius: string;
}>;

const VIDEO_SIZE_OPTIONS = [
  { label: "صغير", value: "240" },
  { label: "متوسط", value: "315" },
  { label: "كبير", value: "480" },
  { label: "كبير جداً", value: "720" },
];

const alignField = {
  type: "custom" as const,
  label: "المحاذاة",
  render: ({
    value,
    onChange,
    Label,
    label,
    readOnly,
  }: {
    value: string;
    onChange: (v: string) => void;
    Label: React.FC<{ label?: string; readOnly?: boolean; children?: React.ReactNode }>;
    label?: string;
    readOnly?: boolean;
  }) => {
    const current = value ?? "center";
    const options = [
      { value: "right", icon: <AlignRight size={18} />, label: "يمين" },
      { value: "center", icon: <AlignCenter size={18} />, label: "وسط" },
      { value: "left", icon: <AlignLeft size={18} />, label: "يسار" },
    ];
    return (
      <Label label={label} readOnly={readOnly}>
        <div style={{ display: "flex", gap: 6 }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.label}
              disabled={readOnly}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 32,
                border: current === opt.value ? "2px solid #3b82f6" : "1px solid #d1d5db",
                borderRadius: 6,
                background: current === opt.value ? "#eff6ff" : "#fff",
                cursor: readOnly ? "not-allowed" : "pointer",
                opacity: readOnly ? 0.5 : 1,
                color: current === opt.value ? "#3b82f6" : "#6b7280",
              }}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </Label>
    );
  },
};

function resolveVideoHeight(value: string | undefined): string {
  if (!value) return "315px";
  if (value.startsWith("theme-")) {
    return `${value.slice(6)}px`;
  }
  return value.includes("px") ? value : `${value}px`;
}

function resolveVideoRadius(
  radius: string | undefined,
  legacy?: {
    radiusMode?: "theme" | "fixed";
    radiusTheme?: string;
    radiusFixed?: string;
  }
): string {
  if (radius) return resolveRadius(radius);
  if (legacy?.radiusMode === "fixed" && legacy.radiusFixed) {
    return resolveRadius(legacy.radiusFixed);
  }
  if (legacy?.radiusMode === "theme" && legacy.radiusTheme) {
    return resolveRadius(`theme-${legacy.radiusTheme}`);
  }
  return resolveRadius("theme-md");
}

const VideoEmbedInner: ComponentConfig<VideoEmbedProps> = {
  label: "فيديو",
  fields: {
    src: {
      type: "textarea",
      label: "رابط يوتيوب",
    },
    align: alignField,
    size: themeFixedSelectField({
      label: "القياس",
      themeOptions: VIDEO_SIZE_OPTIONS,
      type: "number",
      placeholder: "الارتفاع بالبكسل",
    }),
    radius: themeFixedSelectField({
      label: "زاوية الحدود",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
  },
  defaultProps: {
    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    align: "center",
    size: "theme-315",
    radius: "theme-md",
  },
  resolveData: ({ props }) => {
    const legacy = props as VideoEmbedProps & {
      width?: string;
      height?: string;
      radiusMode?: "theme" | "fixed";
      radiusTheme?: string;
      radiusFixed?: string;
    };

    let size = props.size;
    if (!size) {
      const h = legacy.height?.replace(/px$/, "");
      size = h ? (VIDEO_SIZE_OPTIONS.some((o) => o.value === h) ? `theme-${h}` : h) : "theme-315";
    }

    let radius = props.radius;
    if (!radius && legacy.radiusMode) {
      radius =
        legacy.radiusMode === "theme"
          ? `theme-${legacy.radiusTheme ?? "md"}`
          : legacy.radiusFixed?.replace(/px$/, "") || "8";
    }

    return {
      props: {
        align: props.align ?? "center",
        size: size ?? "theme-315",
        radius: radius ?? "theme-md",
      },
    };
  },
  render: (props) => {
    const { src, align, size, radius } = props;
    const legacy = props as VideoEmbedProps & {
      height?: string;
      radiusMode?: "theme" | "fixed";
      radiusTheme?: string;
      radiusFixed?: string;
    };
    const embed = toYouTubeEmbedUrl(src);
    const resolvedAlign = align ?? "center";
    const height = resolveVideoHeight(size ?? legacy.height);
    const r = resolveVideoRadius(radius, legacy);

    const placementStyle: React.CSSProperties = {
      display: "flex",
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      justifyContent:
        resolvedAlign === "left"
          ? "flex-start"
          : resolvedAlign === "right"
            ? "flex-end"
            : "center",
    };

    if (!embed) {
      return (
        <div style={{ ...placementStyle, padding: "8px", color: "var(--theme-color-neutral)" }}>
          أضف رابط يوتيوب
        </div>
      );
    }

    return (
      <div style={placementStyle}>
        <iframe
          title="YouTube video"
          src={embed}
          style={{
            border: "none",
            borderRadius: r,
            display: "block",
            width: "100%",
            height,
            maxWidth: "100%",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  },
};

const WithLayoutVideo = withLayout(VideoEmbedInner);

export const VideoEmbed: typeof WithLayoutVideo = {
  ...WithLayoutVideo,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutVideo as { resolveFields?: (typeof WithLayoutVideo)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Fields<VideoEmbedProps>>).then((f) => omitLayoutField(f));
    }
    if (base == null) {
      return omitLayoutField(VideoEmbedInner.fields as Fields<VideoEmbedProps>);
    }
    return omitLayoutField(base as Fields<VideoEmbedProps>);
  },
};
