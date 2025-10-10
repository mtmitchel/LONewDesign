import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import Konva from "konva";
import type { CanvasElement, ElementId } from "../../../../types";
import { useUnifiedCanvasStore } from "../stores/unifiedCanvasStore";
import { StoreActions } from "../stores/facade";
import ShapesDropdown from "@features/canvas/toolbar/ShapesDropdown";
import UnifiedColorPicker from "@features/canvas/components/UnifiedColorPicker";
import {
  MousePointer,
  Hand,
  Type as TypeIcon,
  StickyNote as StickyNoteLucide,
  Table as TableLucide,
  Shapes as ShapesLucide,
  ArrowRight,
  PenLine,
  Brush,
  Highlighter as HighlighterLucide,
  Eraser as EraserLucide,
  Undo2,
  Redo2,
  GitBranch,
  Image as ImageIcon,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "../../../../../ui/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../../ui/dropdown-menu";

type ToolbarProps = {
  selectedTool?: string;
  onSelectTool?: (toolId: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onTogglePerf?: () => void;
  stroke?: string;
  fill?: string;
  onChangeStroke?: (color: string) => void;
  onChangeFill?: (color: string) => void;
  variant?: "modern" | "figma";
};

const getIcon = (toolId: string) => {
  const iconProps = { size: 22, strokeWidth: 2.4 } as const;
  switch (toolId) {
    case "select":
      return <MousePointer {...iconProps} />;
    case "pan":
      return <Hand {...iconProps} />;
    case "text":
      return <TypeIcon {...iconProps} />;
    case "sticky-note":
      return <StickyNoteLucide {...iconProps} />;
    case "table":
      return <TableLucide {...iconProps} />;
    case "mindmap":
      return <GitBranch {...iconProps} />;
    case "image":
      return <ImageIcon {...iconProps} />;
    case "shapes":
      return <ShapesLucide {...iconProps} />;
    case "connector-line":
      return <ArrowRight {...iconProps} />;
    case "pen":
      return <PenLine {...iconProps} />;
    case "marker":
      return <Brush {...iconProps} />;
    case "highlighter":
      return <HighlighterLucide {...iconProps} />;
    case "eraser":
      return <EraserLucide {...iconProps} />;
    case "undo":
      return <Undo2 {...iconProps} />;
    case "redo":
      return <Redo2 {...iconProps} />;
    case "clear":
      return <Trash2 {...iconProps} />;
    case "zoom-in":
      return <ZoomIn {...iconProps} />;
    case "zoom-out":
      return <ZoomOut {...iconProps} />;
    default:
      return null;
  }
};

const CanvasToolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onSelectTool,
  onUndo,
  onRedo,
}) => {
  const store = useUnifiedCanvasStore();
  const viewportScale = useUnifiedCanvasStore((state) => state.viewport.scale);
  const currentTool = selectedTool ?? "select";

  const handleToolSelect = useMemo(() =>
    onSelectTool ||
    ((_toolId: string) => {
      // Tool selection handled
    }), [onSelectTool]);

  const handleUndo = onUndo || (() => store.undo?.());
  const handleRedo = onRedo || (() => store.redo?.());

  // Zoom control handlers
  const getViewportCenter = useCallback(() => {
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }

    const stage = (window as KonvaWindow).konvaStage;
    if (stage) {
      return { x: stage.width() / 2, y: stage.height() / 2 };
    }

    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }, []);

  const handleZoomIn = useCallback(() => {
    const state = useUnifiedCanvasStore.getState();
    const viewport = state.viewport;
    if (!viewport || typeof viewport.zoomIn !== "function") return;
    const center = getViewportCenter();
    viewport.zoomIn(center.x, center.y);
  }, [getViewportCenter]);

  const handleZoomOut = useCallback(() => {
    const state = useUnifiedCanvasStore.getState();
    const viewport = state.viewport;
    if (!viewport || typeof viewport.zoomOut !== "function") return;
    const center = getViewportCenter();
    viewport.zoomOut(center.x, center.y);
  }, [getViewportCenter]);

  const handleZoomReset = useCallback(() => {
    const state = useUnifiedCanvasStore.getState();
    // Reset to exactly 100% zoom and center viewport
    state.viewport?.reset?.();
  }, []);

  const performClearCanvas = useCallback(() => {
    const s = useUnifiedCanvasStore.getState();
    const begin = s.history?.beginBatch;
    const end = s.history?.endBatch;
    begin?.("clear-canvas");
    const order: string[] =
      s.elementOrder && Array.isArray(s.elementOrder)
        ? [...s.elementOrder]
        : [];
    if (order.length > 0 && s.removeElements) {
      s.removeElements(order, { pushHistory: true, deselect: true });
    } else {
      const ids = order.length ? order : Array.from(s.elements?.keys?.() || []);
      const del = s.element?.delete || s.removeElement || s.elements?.delete;
      ids.forEach((id) => del?.(id));
    }
    (s.selection?.clear || s.clearSelection)?.();
    end?.(true);

    // Clear Konva main/preview/overlay layers immediately (keep background)
    try {
      const stages = (Konva as { stages?: Konva.Stage[] }).stages;
      const stage = stages && stages.length > 0 ? stages[0] : undefined;
      if (stage) {
        const layers = stage.getLayers();
        // Start from index 1 to keep background grid (index 0)
        for (let i = 1; i < layers.length; i++) {
          const ly = layers[i];
          ly.destroyChildren();
          ly.batchDraw();
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    // Force a render by nudging selection version if present
    StoreActions.bumpSelectionVersion?.();
  }, []);

  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleClearCanvas = useCallback(() => {
    if (typeof window === "undefined") {
      performClearCanvas();
      return;
    }
    setConfirmingClear(true);
  }, [performClearCanvas]);

  const confirmClearCanvas = useCallback(() => {
    performClearCanvas();
    setConfirmingClear(false);
  }, [performClearCanvas]);

  const cancelClearCanvas = useCallback(() => {
    setConfirmingClear(false);
  }, []);

  const [shapesOpen, setShapesOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [stickyNoteColorsOpen, setStickyNoteColorsOpen] = useState(false);
  const [shapeAnchorRect, setShapeAnchorRect] = useState<DOMRect | null>(null);
  const [stickyNoteAnchorRect, setStickyNoteAnchorRect] =
    useState<DOMRect | null>(null);
  const shapesBtnRef = useRef<HTMLButtonElement | null>(null);
  const stickyNoteBtnRef = useRef<HTMLButtonElement | null>(null);

  const updateShapeAnchorRect = useCallback(() => {
    if (!shapesBtnRef.current) return;
    const nextRect = shapesBtnRef.current.getBoundingClientRect();
    setShapeAnchorRect((current) => {
      if (!current) return nextRect;
      if (
        current.top !== nextRect.top ||
        current.left !== nextRect.left ||
        current.width !== nextRect.width ||
        current.height !== nextRect.height
      ) {
        return nextRect;
      }
      return current;
    });
  }, []);

  const updateStickyNoteAnchorRect = useCallback(() => {
    if (!stickyNoteBtnRef.current) return;
    const nextRect = stickyNoteBtnRef.current.getBoundingClientRect();
    setStickyNoteAnchorRect((current) => {
      if (!current) return nextRect;
      if (
        current.top !== nextRect.top ||
        current.left !== nextRect.left ||
        current.width !== nextRect.width ||
        current.height !== nextRect.height
      ) {
        return nextRect;
      }
      return current;
    });
  }, []);

  useLayoutEffect(() => {
    updateShapeAnchorRect();
    if (!shapesOpen) return;

    const handleWindowChange = () => updateShapeAnchorRect();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleWindowChange);
      window.addEventListener("scroll", handleWindowChange, true);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleWindowChange);
        window.removeEventListener("scroll", handleWindowChange, true);
      }
    };
  }, [shapesOpen, updateShapeAnchorRect]);

  useLayoutEffect(() => {
    updateStickyNoteAnchorRect();
    if (!stickyNoteColorsOpen) return;

    const handleWindowChange = () => updateStickyNoteAnchorRect();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleWindowChange);
      window.addEventListener("scroll", handleWindowChange, true);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleWindowChange);
        window.removeEventListener("scroll", handleWindowChange, true);
      }
    };
  }, [stickyNoteColorsOpen, updateStickyNoteAnchorRect]);

  const selectAndCloseShapes = useCallback(
    (toolId: string) => {
      handleToolSelect(toolId);
      setShapesOpen(false);
      setConnectorsOpen(false);
      setStickyNoteColorsOpen(false);
    },
    [handleToolSelect],
  );

  const handleStickyClick = useCallback(() => {
    handleToolSelect("sticky-note");
    setShapesOpen(false);
    setConnectorsOpen(false);
    setStickyNoteColorsOpen((prev) => !prev);
  }, [handleToolSelect]);

  const toggleShapesDropdown = useCallback(() => {
    setStickyNoteColorsOpen(false);
    setConnectorsOpen(false);
    setShapesOpen((prev) => !prev);
  }, []);

  const handleConnectorOpenChange = useCallback((open: boolean) => {
    setConnectorsOpen(open);
    if (open) {
      setShapesOpen(false);
      setStickyNoteColorsOpen(false);
    }
  }, []);

  const handleConnectorSelect = useCallback(
    (toolId: string) => {
      handleToolSelect(toolId);
      setConnectorsOpen(false);
    },
    [handleToolSelect],
  );

  const applyStickyColorToSelection = useCallback((color: string) => {
    const state = useUnifiedCanvasStore.getState();

    const collectSelectedIds = (): ElementId[] => {
      if (typeof state.getSelectedIds === "function") {
        return state.getSelectedIds().map((id) => id as ElementId);
      }

      const { selectedElementIds } = state as {
        selectedElementIds?: Set<ElementId> | ElementId[];
      };

      if (selectedElementIds instanceof Set) {
        return Array.from(selectedElementIds);
      }

      if (Array.isArray(selectedElementIds)) {
        return selectedElementIds as ElementId[];
      }

      return [];
    };

    const selectedIds = collectSelectedIds();
    if (selectedIds.length === 0) return;

    const getElement = (() => {
      if (typeof state.getElement === "function") return state.getElement.bind(state);
      if (state.element && typeof state.element.getById === "function") {
        return state.element.getById.bind(state.element) as (id: ElementId) => CanvasElement | undefined;
      }
      return null;
    })();

    if (!getElement) return;

    const patches: Array<{ id: ElementId; patch: Partial<CanvasElement> }> = [];

    selectedIds.forEach((id) => {
      const element = getElement(id);
      if (!element || element.type !== "sticky-note") return;

      const nextStyle: CanvasElement["style"] = {
        ...(element.style ?? {}),
        fill: color,
      };

      patches.push({
        id,
        patch: {
          fill: color,
          style: nextStyle,
        },
      });
    });

    if (patches.length === 0) return;

    const applyUpdates = () => {
      if (typeof state.updateElements === "function") {
        state.updateElements(patches, { pushHistory: true });
        return;
      }

      if (state.element && typeof state.element.update === "function") {
        patches.forEach(({ id, patch }) => state.element.update(id, patch));
        return;
      }

      if (typeof state.updateElement === "function") {
        patches.forEach(({ id, patch }) => {
          state.updateElement(id, patch, { pushHistory: true });
        });
      }
    };

    if (typeof state.withUndo === "function") {
      state.withUndo("Change sticky note color", applyUpdates);
    } else {
      applyUpdates();
    }
  }, []);

  const handleSelectStickyColor = useCallback((color: string) => {
    applyStickyColorToSelection(color);

    // Update the default sticky note color for NEW sticky notes
    const state = useUnifiedCanvasStore.getState();
    const setUiStickyColor = state.ui?.setStickyNoteColor;
    const setLegacyStickyColor = state.setStickyNoteColor;

    if (typeof setUiStickyColor === "function") {
      setUiStickyColor(color);
    } else if (typeof setLegacyStickyColor === "function") {
      setLegacyStickyColor(color);
    }

    // Close portal, keep tool active for quick placement
    setStickyNoteColorsOpen(false);
  }, [applyStickyColorToSelection]);

  const baseButtonClass =
    "group inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-transparent text-[color:var(--text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[color:var(--border-default)] hover:bg-[color:var(--primary-tint-10)] hover:text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas-toolbar-bg)]";

  const iconButtonClass = (isActive: boolean) =>
    cn(
      baseButtonClass,
      "h-11 w-11",
      isActive &&
        "border-transparent bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-[0_12px_28px_rgba(15,23,42,0.18)]",
    );

  const destructiveButtonClass = cn(
    baseButtonClass,
    "h-11 w-11 text-[color:var(--danger)] hover:border-[color:var(--danger)]/30 hover:bg-[color:var(--danger)]/12 hover:text-[color:var(--danger)] focus-visible:ring-[var(--danger)] focus-visible:ring-offset-[var(--canvas-toolbar-bg)]",
  );

  const zoomLabelButtonClass = cn(
    baseButtonClass,
    "h-11 min-w-[72px] px-[var(--space-3)] text-[length:var(--text-sm)] font-medium tracking-tight justify-center text-[color:var(--text-primary)]",
  );

  const Divider = () => (
    <span
      aria-hidden="true"
      className="h-8 w-px rounded-full bg-[color:var(--border-subtle)]/80"
    />
  );

  const toolBtn = (id: string, title: string) => (
    <button
      key={id}
      type="button"
      className={iconButtonClass(currentTool === id)}
      aria-pressed={currentTool === id}
      aria-label={title}
      title={title}
      data-testid={`tool-${id === "draw-rectangle" ? "rectangle" : id}`}
      onClick={() => handleToolSelect(id)}
    >
      {getIcon(id)}
    </button>
  );

  const stickySwatchColor =
    store.ui?.stickyNoteColor || store.colors?.stickyNote || "#FFEFC8";

  return (
    <>
      <div
        role="toolbar"
        aria-label="Canvas tools"
        className="flex items-center gap-[var(--space-2)]"
      >
        <div className="flex items-center gap-[var(--space-1)]">
          {toolBtn("select", "Select")}
          {toolBtn("pan", "Pan")}
        </div>
        <Divider />
        <div className="flex items-center gap-[var(--space-1)]">
          <button
            type="button"
            ref={stickyNoteBtnRef}
            className={iconButtonClass(currentTool === "sticky-note")}
            aria-expanded={stickyNoteColorsOpen}
            aria-haspopup="menu"
            aria-pressed={currentTool === "sticky-note"}
            aria-label="Sticky note colors"
            title="Sticky Note"
            data-testid="tool-sticky-note"
            onClick={handleStickyClick}
          >
            {getIcon("sticky-note")}
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full border border-white/70 shadow-[0_1px_2px_rgba(15,23,42,0.18)]"
              style={{ backgroundColor: stickySwatchColor }}
            />
          </button>
          {toolBtn("text", "Text")}
          {toolBtn("table", "Table")}
          {toolBtn("image", "Image")}
          <button
            type="button"
            ref={shapesBtnRef}
            className={iconButtonClass(false)}
            aria-expanded={shapesOpen}
            aria-haspopup="menu"
            aria-label="Shapes"
            title="Shapes"
            onClick={toggleShapesDropdown}
          >
            {getIcon("shapes")}
          </button>
          <DropdownMenu open={connectorsOpen} onOpenChange={handleConnectorOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={iconButtonClass(
                  currentTool === "connector-line" || currentTool === "connector-arrow",
                )}
                aria-haspopup="menu"
                aria-expanded={connectorsOpen}
                aria-pressed={currentTool === "connector-line" || currentTool === "connector-arrow"}
                aria-label="Connector"
                title="Connector"
              >
                {getIcon("mindmap")}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={8}
              className="min-w-[11rem] rounded-[var(--radius-md)] border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-[var(--elevation-lg)]"
            >
              <DropdownMenuItem
                onSelect={() => handleConnectorSelect("connector-line")}
                className="text-[length:var(--text-sm)]"
              >
                Line
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleConnectorSelect("connector-arrow")}
                className="text-[length:var(--text-sm)]"
              >
                Arrow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Divider />
        <div className="flex items-center gap-[var(--space-1)]">
          {toolBtn("pen", "Pen")}
          {toolBtn("marker", "Marker")}
          {toolBtn("highlighter", "Highlighter")}
          {toolBtn("eraser", "Eraser")}
        </div>
        <Divider />
        <div className="flex items-center gap-[var(--space-1)]">
          <button
            type="button"
            className={iconButtonClass(false)}
            title="Undo"
            aria-label="Undo"
            onClick={handleUndo}
          >
            {getIcon("undo")}
          </button>
          <button
            type="button"
            className={iconButtonClass(false)}
            title="Redo"
            aria-label="Redo"
            onClick={handleRedo}
          >
            {getIcon("redo")}
          </button>
          <button
            type="button"
            className={destructiveButtonClass}
            title="Clear canvas"
            aria-label="Clear canvas"
            onClick={handleClearCanvas}
          >
            {getIcon("clear")}
          </button>
        </div>
        <Divider />
        <div className="flex items-center gap-[var(--space-1)]">
          <button
            type="button"
            className={iconButtonClass(false)}
            title="Zoom in"
            aria-label="Zoom in"
            onClick={handleZoomIn}
            data-testid="zoom-in"
          >
            {getIcon("zoom-in")}
          </button>
          <button
            type="button"
            className={zoomLabelButtonClass}
            title="Reset zoom (100%)"
            aria-label="Reset zoom"
            onClick={handleZoomReset}
            data-testid="zoom-reset"
          >
            {Math.round((viewportScale ?? 1) * 100)}%
          </button>
          <button
            type="button"
            className={iconButtonClass(false)}
            title="Zoom out"
            aria-label="Zoom out"
            onClick={handleZoomOut}
            data-testid="zoom-out"
          >
            {getIcon("zoom-out")}
          </button>
        </div>
      </div>

      {/* Popovers/Portals */}
      <ShapesDropdown
        open={shapesOpen}
        anchorRect={shapeAnchorRect}
        onClose={() => setShapesOpen(false)}
        onSelectShape={selectAndCloseShapes}
      />
      <UnifiedColorPicker
        open={stickyNoteColorsOpen}
        mode="figma-horizontal"
        anchorRect={stickyNoteAnchorRect}
        onClose={() => setStickyNoteColorsOpen(false)}
        onChange={handleSelectStickyColor}
        color={stickySwatchColor}
      />
      {confirmingClear && typeof document !== "undefined"
        ? createPortal(
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(22, 24, 35, 0.45)",
                display: "grid",
                placeItems: "center",
                padding: "32px",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: "var(--bg-panel, #ffffff)",
                  color: "var(--text-primary, #1f2544)",
                  padding: "24px",
                  borderRadius: "16px",
                  minWidth: "320px",
                  boxShadow: "0 26px 54px rgba(24,25,32,0.22)",
                  border: "1px solid var(--border-subtle, rgba(82,88,126,0.16))",
                }}
              >
                <h3 style={{ margin: "0 0 12px", fontSize: "18px" }}>Clear canvas?</h3>
                <p style={{ margin: "0 0 20px", lineHeight: 1.5 }}>
                  This removes every element from the canvas. You can undo afterwards if you change your mind.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={cancelClearCanvas}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-subtle, rgba(82,88,126,0.16))",
                      background: "transparent",
                      color: "var(--text-secondary, #4c5570)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmClearCanvas}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #ef4444, #f97316)",
                      color: "#ffffff",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 12px 28px rgba(239, 68, 68, 0.25)",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default CanvasToolbar;

// Legacy export aliases for backward compatibility
export { CanvasToolbar as ModernKonvaToolbar, CanvasToolbar as FigJamToolbar };
type KonvaWindow = Window & { konvaStage?: Konva.Stage };
