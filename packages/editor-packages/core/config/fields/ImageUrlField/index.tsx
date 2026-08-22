"use client";
import React, { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { AutoField, FieldLabel, type CustomField } from "@/core";
import { getClassNameFactory } from "@/core/lib";
import { resolveMediaUrl } from "@/lib/media";
import { uploadMedia } from "@/modules/media/upload/actions";
import { validateImageFile } from "@/modules/media/upload/init";
import { MEDIA_CONSTRAINTS } from "@/modules/media/upload/types";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ImageUrlField", styles);

type ImageUrlFieldRenderProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  readOnly?: boolean;
  label?: string;
};

/**
 * Text input for the image URL plus an upload button that hits
 * POST /media/upload and fills the input with the returned `publicUrl` —
 * the user can still paste/edit a URL directly instead of uploading.
 */
function ImageUrlFieldRender({
  value,
  onChange,
  readOnly,
  label,
}: ImageUrlFieldRenderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);

    const validation = validateImageFile(file);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setUploading(true);
    try {
      const response = await uploadMedia([file]);
      const uploaded = response.items[0];
      if (uploaded?.publicUrl) {
        // `publicUrl` comes back tenant-relative (`/api/v1/public/media/…`) —
        // resolve it against NEXT_PUBLIC_MEDIA_URL so the stored value is a
        // complete, directly renderable URL (render doesn't re-resolve `src`).
        onChange(resolveMediaUrl(uploaded.publicUrl) ?? uploaded.publicUrl);
      } else {
        setError("تعذّر رفع الصورة");
      }
    } catch {
      setError("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const resolvedPreview = resolveMediaUrl(value);

  return (
    <FieldLabel label={label ?? "رابط الصورة"} icon={<ImagePlus size={14} />}>
      <div className={getClassName()}>
        <AutoField
          field={{ type: "text" }}
          readOnly={readOnly}
          value={value ?? ""}
          onChange={(url) => onChange(String(url ?? ""))}
        />

        <div className={getClassName("uploadRow")}>
          <button
            type="button"
            className={getClassName("uploadButton")}
            disabled={readOnly || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 size={13} className={getClassName("spinner")} />
            ) : (
              <ImagePlus size={13} />
            )}
            <span>{uploading ? "جارٍ الرفع..." : "رفع صورة"}</span>
          </button>

          {resolvedPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedPreview}
              alt=""
              className={getClassName("preview")}
            />
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={MEDIA_CONSTRAINTS.allowedTypes.join(",")}
          className={getClassName("hiddenInput")}
          disabled={readOnly || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            void handleFile(file);
            e.target.value = "";
          }}
        />

        {error ? <div className={getClassName("error")}>{error}</div> : null}
      </div>
    </FieldLabel>
  );
}

/**
 * Use this in block `fields` maps in place of a plain `{ type: "text" }`
 * image-url field:
 *
 *   fields: {
 *     src: imageUrlField({ label: "رابط الصورة" }),
 *   }
 */
export function imageUrlField(
  opts: { label?: string } = {}
): CustomField<string> {
  return {
    type: "custom",
    label: opts.label ?? "رابط الصورة",
    render: ({ value, onChange, readOnly }) => (
      <ImageUrlFieldRender
        value={value as string | undefined}
        onChange={onChange}
        readOnly={readOnly}
        label={opts.label}
      />
    ),
  } as CustomField<string>;
}
