import { DropZoneEditPure, DropZonePure } from "../../../DropZone";
import { rootDroppableId } from "../../../../lib/root-droppable-id";
import { RefObject, useCallback, useEffect, useRef, useMemo } from "react";
import { useAppStore } from "../../../../store";
import AutoFrame, { autoFrameContext } from "../../../AutoFrame";
import styles from "./styles.module.css";
import { getClassNameFactory } from "../../../../lib";
import { DefaultRootRenderProps } from "../../../../types";
import { Render } from "../../../Render";
import { BubbledPointerEvent } from "../../../../lib/bubble-pointer-event";
import { useSlots } from "../../../../lib/use-slots";
import { useRichtextProps } from "../../../RichTextEditor/lib/use-richtext-props";
import { BlockErrorBoundary } from "../../../BlockErrorBoundary";

const getClassName = getClassNameFactory("PuckPreview", styles);

type PageProps = DefaultRootRenderProps;

const useBubbleIframeEvents = (ref: RefObject<HTMLIFrameElement | null>) => {
  const status = useAppStore((s) => s.status);

  useEffect(() => {
    if (ref.current && status === "READY") {
      const iframe = ref.current;

      const handlePointerMove = (event: PointerEvent) => {
        const evt = new BubbledPointerEvent("pointermove", {
          ...event,
          bubbles: true,
          cancelable: false,
          clientX: event.clientX,
          clientY: event.clientY,
          originalTarget: event.target,
        });

        iframe.dispatchEvent(evt as any);
      };

      const register = () => {
        unregister();

        // Add event listeners
        iframe.contentDocument?.addEventListener(
          "pointermove",
          handlePointerMove,
          {
            capture: true,
          }
        );
      };

      const unregister = () => {
        // Clean up event listeners
        iframe.contentDocument?.removeEventListener(
          "pointermove",
          handlePointerMove
        );
      };

      register();

      return () => {
        unregister();
      };
    }
  }, [status]);
};

export const Preview = ({ id = "puck-preview" }: { id?: string }) => {
  const dispatch = useAppStore((s) => s.dispatch);
  const root = useAppStore((s) => s.state.data.root);
  const config = useAppStore((s) => s.config);
  const setStatus = useAppStore((s) => s.setStatus);
  const iframe = useAppStore((s) => s.iframe);
  const overrides = useAppStore((s) => s.overrides);
  const metadata = useAppStore((s) => s.metadata);
  const renderData = useAppStore((s) =>
    s.state.ui.previewMode === "edit" ? null : s.state.data
  );

  const Page = useCallback<React.FC<PageProps>>(
    (pageProps) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const propsWithSlots = useSlots(
        config,
        { type: "root", props: pageProps },
        DropZoneEditPure
      );

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const richtextProps = useRichtextProps(
        config.root?.fields ?? {},
        pageProps
      );

      return config.root?.render ? (
        config.root?.render({
          id: "puck-root",
          ...propsWithSlots,
          ...richtextProps,
        })
      ) : (
        <>{propsWithSlots.children}</>
      );
    },
    [config]
  );

  const Frame = useMemo(() => overrides.iframe, [overrides]);

  // DEPRECATED
  const rootProps = root.props || root;

  const ref = useRef<HTMLIFrameElement>(null);

  useBubbleIframeEvents(ref);

  // Last line of defense: block-level boundaries live in DropZone, but a
  // crash in root render / zone plumbing outside any block used to white-
  // screen the whole editor. Recover in place instead.
  const canvasFallback = (error: Error, reset: () => void) => (
    <div
      dir="rtl"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        minHeight: "50vh",
        padding: 32,
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <strong style={{ fontSize: 16 }}>حدث خطأ أثناء عرض الصفحة</strong>
      <code dir="ltr" style={{ fontSize: 12, opacity: 0.7 }}>
        {error.message}
      </code>
      <button
        type="button"
        onClick={reset}
        style={{
          border: "1px solid currentColor",
          borderRadius: 6,
          background: "transparent",
          padding: "6px 16px",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        إعادة تحميل الكانفس
      </button>
    </div>
  );

  const innerContent = !renderData ? (
    <Page
      {...rootProps}
      puck={{
        renderDropZone: DropZonePure,
        isEditing: true,
        dragRef: null,
        metadata,
      }}
      editMode={true} // DEPRECATED
    >
      <DropZonePure zone={rootDroppableId} />
    </Page>
  ) : (
    <Render data={renderData} config={config} metadata={metadata} />
  );

  const inner = (
    <BlockErrorBoundary
      fallback={canvasFallback}
      onError={(error) => {
        console.error("[puck] Canvas failed to render:", error);
      }}
    >
      {innerContent}
    </BlockErrorBoundary>
  );

  useEffect(() => {
    if (!iframe.enabled) {
      setStatus("READY");
    }
  }, [iframe.enabled]);

  return (
    <div
      className={getClassName()}
      id={id}
      data-puck-preview
      onClick={(e) => {
        const el = e.target as Element;

        if (
          !el.hasAttribute("data-puck-component") &&
          !el.hasAttribute("data-puck-dropzone")
        ) {
          dispatch({ type: "setUi", ui: { itemSelector: null, zonePreviewRoot: null } });
        }
      }}
    >
      {iframe.enabled ? (
        <AutoFrame
          id="preview-frame"
          className={getClassName("frame")}
          data-rfd-iframe
          onReady={() => {
            setStatus("READY");
          }}
          onNotReady={() => {
            setStatus("MOUNTED");
          }}
          frameRef={ref}
        >
          <autoFrameContext.Consumer>
            {({ document }) => {
              if (Frame) {
                return <Frame document={document}>{inner}</Frame>;
              }

              return inner;
            }}
          </autoFrameContext.Consumer>
        </AutoFrame>
      ) : (
        <div
          id="preview-frame"
          className={getClassName("frame")}
          ref={ref}
          data-puck-entry
        >
          {inner}
        </div>
      )}
    </div>
  );
};
