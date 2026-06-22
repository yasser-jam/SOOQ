import React from "react";
import type { CustomField } from "@/core/types";
import { ComponentConfig } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import editorStyles from "./editorAlert.module.css";
import styles from "./styles.module.css";

export type ContentHtmlProps = WithLayout<{
  html: string;
}>;

const htmlField: CustomField<string> = {
  type: "custom",
  label: "HTML",
  key: "content-html-markup",
  render: ({ id, value, onChange, readOnly }) => (
    <div>
      <textarea
        id={id}
        className={editorStyles.textarea}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        aria-describedby={`${id}-mobile-notice`}
      />
      <section
        className={editorStyles.alert}
        role="alert"
        aria-live="polite"
        id={`${id}-mobile-notice`}
      >
        <p className={editorStyles.alertTitle}>Mobile</p>
        <p className={editorStyles.alertBody}>
          This section is not shown on phones and small screens. Visitors on mobile will not see this
          block.
        </p>
      </section>
    </div>
  ),
};

const ContentHtmlInner: ComponentConfig<ContentHtmlProps> = {
  label: "HTML",
  fields: {
    html: htmlField,
  },
  defaultProps: {
    html: "<p>Edit <strong>HTML</strong> here. You can use headings, lists, and links.</p>",
  },
  render: ({ html }) => (
    <div
      className={styles.root}
      dangerouslySetInnerHTML={{ __html: html ?? "" }}
    />
  ),
};

export const ContentHtml = withLayout(ContentHtmlInner);
