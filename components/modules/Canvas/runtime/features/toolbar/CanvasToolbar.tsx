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
  Maximize2,
} from "lucide-react";
import { cn } from "../../../../../ui/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../../ui/tooltip";

type Tool =
  | "select" | "pan"
  | "text" | "sticky-note" | "table" | "image"
  | "shapes" | "connector" | "mindmap"
  | "pen" | "marker" | "highlighter" | "eraser"
  | "undo" | "redo" | "clear";

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
  const iconProps = { size: 16, strokeWidth: 2 } as const; // --canvas-icon-size
  switch (toolId) {
    case "select": return <MousePointer {...iconProps} />;
    case "pan": return <Hand {...iconProps} />;
    case "text": return <TypeIcon {...iconProps} />;
    case "sticky-note": return <StickyNoteLucide {...iconProps} />;
    case "table": return <TableLucide {...iconProps} />;
    case "mindmap": return <GitBranch {...iconProps} />;
    case "image": return <ImageIcon {...iconProps} />;
    case "shapes": return <ShapesLucide {...iconProps} />;
    case "connector": case "connector-line": case "connector-arrow": return <ArrowRight {...iconProps} />;
    case "pen": return <PenLine {...iconProps} />;
    case "marker": return <Brush {...iconProps} />;
    case "highlighter": return <HighlighterLucide {...iconProps} />;
    case "eraser": return <EraserLucide {...iconProps} />;
    case "undo": return <Undo2 {...iconProps} />;
    case "redo": return <Redo2 {...iconProps} />;
    case "clear": return <Trash2 {...iconProps} />;
    case "zoom-fit": return <Maximize2 {...iconProps} />;
    case "zoom-in": return <ZoomIn {...iconProps} />;
    case "zoom-out": return <ZoomOut {...iconProps} />;
    default: return null;
  }
};

const getLabel = (tool: Tool): string => {
  const labels: Record<Tool, string> = {
    select: "Select",
    pan: "Pan",
    text: "Text",
    "sticky-note": "Sticky note",
    table: "Table",
    image: "Image",
    shapes: "Shapes",
    connector: "Connector",
    mindmap: "Mind map",
    pen: "Pen",
    marker: "Marker",
    highlighter: "Highlighter",
    eraser: "Eraser",
    undo: "Undo",
    redo: "Redo",
    clear: "Clear canvas",
  };
  return labels[tool] || tool;
};

const getShortcut = (tool: Tool): string | undefined => {
  const shortcuts: Partial<Record<Tool, string>> = {
    select: "v",
    pan: "h",
    text: "t",
    shapes: "r", // rectangle as primary shape
    pen: "p",
    undo: "Meta+z Ctrl+z",
    redo: "Meta+Shift+z Ctrl+Shift+z",
  };
  return shortcuts[tool];
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

  // Store handlers
  const handleToolSelect = useMemo(() =>
    onSelectTool || ((_toolId: string) => {}), [onSelectTool]);

  const handleUndo = onUndo || (() => store.undo?.());
  const handleRedo = onRedo || (() => store.redo?.());

  // Can undo/redo state (for aria-disabled)
  // Note: Some store implementations don't expose canUndo/canRedo, so we default to true
  const canUndo = true; // Simplified for compatibility
  const canRedo = true;

  // Zoom handlers
  const getViewportCenter = useCallback(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const stage = (window as KonvaWindow).konvaStage;
    if (stage) return { x: stage.width() / 2, y: stage.height() / 2 };
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
    state.viewport?.reset?.();
  }, []);

  const handleZoomFit = useCallback(() => {
    const state = useUnifiedCanvasStore.getState();
    const viewport = state.viewport;
    if (!viewport || typeof viewport.fitToContent !== "function") return;

    viewport.fitToContent(64);
  }, []);

  // Clear canvas
  const performClearCanvas = useCallback(() => {
    const s = useUnifiedCanvasStore.getState();
    const begin = s.history?.beginBatch;
    const end = s.history?.endBatch;
    begin?.("clear-canvas");
    const order: string[] = s.elementOrder && Array.isArray(s.elementOrder) ? [...s.elementOrder] : [];
    if (order.length > 0 && s.removeElements) {
      s.removeElements(order, { pushHistory: true, deselect: true });
    } else {
      const ids = order.length ? order : Array.from(s.elements?.keys?.() || []);
      const del = s.element?.delete || s.removeElement || s.elements?.delete;
      ids.forEach((id) => del?.(id));
    }
    (s.selection?.clear || s.clearSelection)?.();
    end?.(true);

    // Clear Konva layers
    try {
      const stages = (Konva as { stages?: Konva.Stage[] }).stages;
      const stage = stages && stages.length > 0 ? stages[0] : undefined;
      if (stage) {
        const layers = stage.getLayers();
        for (let i = 1; i < layers.length; i++) {
          const ly = layers[i];
          ly.destroyChildren();
          ly.batchDraw();
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }

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

  // Shape/Sticky/Connector dropdowns
  const [shapesOpen, setShapesOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [stickyNoteColorsOpen, setStickyNoteColorsOpen] = useState(false);
  const [shapeAnchorRect, setShapeAnchorRect] = useState<DOMRect | null>(null);
  const [stickyNoteAnchorRect, setStickyNoteAnchorRect] = useState<DOMRect | null>(null);
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

    const state = useUnifiedCanvasStore.getState();
    const setUiStickyColor = state.ui?.setStickyNoteColor;
    const setLegacyStickyColor = state.setStickyNoteColor;

    if (typeof setUiStickyColor === "function") {
      setUiStickyColor(color);
    } else if (typeof setLegacyStickyColor === "function") {
      setLegacyStickyColor(color);
    }

    setStickyNoteColorsOpen(false);
  }, [applyStickyColorToSelection]);

  // Tool groups (logical clustering)
  const toolGroups: Tool[][] = [
    ["select", "pan"],
    ["sticky-note", "text", "table", "image"],
    ["shapes", "connector"],
    ["pen", "marker", "highlighter", "eraser"],
    ["undo", "redo", "clear"],
  ];

  // Styling (using new tokens)
  const toolButtonClass = (isActive: boolean, isDisabled?: boolean) =>
    cn(
      "h-9 w-9 grid place-items-center rounded-[var(--radius-md)]",
      "border border-transparent",
      "transition-[var(--duration-fast)] ease-[var(--easing-standard)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--canvas-active-ring)]",
      isDisabled && "opacity-40 pointer-events-none",
      isActive
        ? "bg-[var(--btn-primary-bg)] text-[color:var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
    );

  const Divider = () => (
    <span
      aria-hidden="true"
      className="h-6 w-px bg-[var(--canvas-sep)]"
    />
  );

  const ToolButton = ({ tool }: { tool: Tool }) => {
    const isActive = currentTool === tool;
    const isDisabled = (tool === "undo" && !canUndo) || (tool === "redo" && !canRedo);
    const label = getLabel(tool);
    const shortcut = getShortcut(tool);

    const button = (
      <button
        type="button"
        className={toolButtonClass(isActive, isDisabled)}
        aria-pressed={isActive}
        aria-disabled={isDisabled}
        aria-label={label}
        aria-keyshortcuts={shortcut}
        title={label}
        onClick={() => {
          if (tool === "undo") handleUndo();
          else if (tool === "redo") handleRedo();
          else if (tool === "clear") handleClearCanvas();
          else handleToolSelect(tool);
        }}
      >
        {getIcon(tool)}
      </button>
    );

    if (shortcut || isDisabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            {label}
            {shortcut && <span className="text-[var(--text-tertiary)] ml-2">({shortcut})</span>}
            {isDisabled && <span className="text-[var(--text-tertiary)]"> - No history</span>}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  const stickySwatchColor =
    store.ui?.stickyNoteColor || store.colors?.stickyNote || "#FFEFC8";

  return (
    <>
      <div
        role="toolbar"
        aria-label="Canvas tools"
        className={cn(
          "flex items-center overflow-hidden",
          "bg-[var(--canvas-toolbar-bg)] border border-[var(--canvas-toolbar-border)]",
          "rounded-[var(--canvas-toolbar-radius)] shadow-[var(--canvas-toolbar-elevation)]",
          "px-[var(--canvas-toolbar-pad-x)] py-[var(--canvas-toolbar-pad-y)] gap-[var(--canvas-toolbar-gap)]"
        )}
      >
        {toolGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            <div className="flex items-center gap-[var(--space-1)]">
              {group.map((tool) => {
                // Special handling for certain tools
                if (tool === "sticky-note") {
                  return (
                    <Tooltip key={tool}>
                      <TooltipTrigger asChild>
                        <button
                          ref={stickyNoteBtnRef}
                          type="button"
                          className={cn(toolButtonClass(currentTool === "sticky-note"), "relative")}
                          aria-pressed={currentTool === "sticky-note"}
                          aria-expanded={stickyNoteColorsOpen}
                          aria-haspopup="menu"
                          aria-label={getLabel(tool)}
                          onClick={handleStickyClick}
                        >
                          {getIcon(tool)}
                          <span
                            aria-hidden="true"
                            className="absolute bottom-1 right-1 h-2 w-2 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: stickySwatchColor }}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{getLabel(tool)}</TooltipContent>
                    </Tooltip>
                  );
                }
                if (tool === "shapes") {
                  return (
                    <Tooltip key={tool}>
                      <TooltipTrigger asChild>
                        <button
                          ref={shapesBtnRef}
                          type="button"
                          className={toolButtonClass(false)}
                          aria-expanded={shapesOpen}
                          aria-haspopup="menu"
                          aria-label={getLabel(tool)}
                          aria-keyshortcuts="r"
                          onClick={toggleShapesDropdown}
                        >
                          {getIcon(tool)}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{getLabel(tool)} (r)</TooltipContent>
                    </Tooltip>
                  );
                }
                if (tool === "connector") {
                  return (
                    <DropdownMenu key={tool} open={connectorsOpen} onOpenChange={handleConnectorOpenChange}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={toolButtonClass(
                                currentTool === "connector-line" || currentTool === "connector-arrow"
                              )}
                              aria-pressed={currentTool === "connector-line" || currentTool === "connector-arrow"}
                              aria-haspopup="menu"
                              aria-expanded={connectorsOpen}
                              aria-label="Connector"
                            >
                              {getIcon("mindmap")}
                            </button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Connector</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent
                        align="start"
                        sideOffset={8}
                        className={cn(
                          "rounded-[var(--canvas-popover-radius)] shadow-[var(--canvas-popover-elevation)]",
                          "bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
                          "p-[var(--canvas-popover-pad)]"
                        )}
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
                  );
                }
                return <ToolButton key={tool} tool={tool} />;
              })}
            </div>
            {gi < toolGroups.length - 1 && <Divider />}
          </React.Fragment>
        ))}

        {/* Zoom controls */}
        <Divider />
        <div className="flex items-center gap-[var(--space-1)]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={toolButtonClass(false)}
                aria-label="Zoom out"
                aria-keyshortcuts="-"
                onClick={handleZoomOut}
              >
                {getIcon("zoom-out")}
              </button>
            </TooltipTrigger>
            <TooltipContent>Zoom out (-)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  "h-9 px-[var(--canvas-zoom-pad-x)] py-[var(--canvas-zoom-pad-y)]",
                  "rounded-[var(--canvas-zoom-radius)]",
                  "text-[length:var(--text-sm)] font-medium text-[var(--text-primary)]",
                  "hover:bg-[var(--bg-surface-elevated)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--canvas-active-ring)]"
                )}
                aria-label="Reset zoom"
                onClick={handleZoomReset}
              >
                {Math.round((viewportScale ?? 1) * 100)}%
              </button>
            </TooltipTrigger>
            <TooltipContent>Reset zoom (100%)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={toolButtonClass(false)}
                aria-label="Fit to canvas"
                onClick={handleZoomFit}
              >
                {getIcon("zoom-fit")}
              </button>
            </TooltipTrigger>
            <TooltipContent>Fit to content</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={toolButtonClass(false)}
                aria-label="Zoom in"
                aria-keyshortcuts="+"
                onClick={handleZoomIn}
              >
                {getIcon("zoom-in")}
              </button>
            </TooltipTrigger>
            <TooltipContent>Zoom in (+)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Popovers */}
      {shapesOpen && (
        <ShapesDropdown
          open={shapesOpen}
          anchorRect={shapeAnchorRect}
          onClose={() => setShapesOpen(false)}
          onSelectShape={selectAndCloseShapes}
        />
      )}
      {stickyNoteColorsOpen && (
        <UnifiedColorPicker
          open={stickyNoteColorsOpen}
          mode="figma-horizontal"
          anchorRect={stickyNoteAnchorRect}
          onClose={() => setStickyNoteColorsOpen(false)}
          onChange={handleSelectStickyColor}
          color={stickySwatchColor}
        />
      )}

      {/* Clear canvas confirmation dialog */}
      {confirmingClear && typeof document !== "undefined"
        ? createPortal(
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="clear-canvas-title"
              aria-describedby="clear-canvas-description"
              className="fixed inset-0 grid place-items-center p-8 z-[var(--z-overlay)] bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)]"
            >
              <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--elevation-xl)] border border-[var(--border-subtle)] p-6 min-w-[320px] max-w-[480px]">
                <h3 id="clear-canvas-title" className="text-[length:var(--text-lg)] font-semibold text-[var(--text-primary)] mb-2">
                  Clear canvas?
                </h3>
                <p id="clear-canvas-description" className="text-[length:var(--text-sm)] text-[var(--text-secondary)] mb-5 leading-relaxed">
                  This removes every element from the canvas. You can undo afterwards if you change your mind.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={cancelClearCanvas}
                    className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-[var(--duration-fast)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmClearCanvas}
                    className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--danger)] text-white font-medium hover:bg-[var(--danger-hover)] transition-[var(--duration-fast)] shadow-[var(--elevation-sm)]"
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

// Legacy export aliases
export { CanvasToolbar as ModernKonvaToolbar, CanvasToolbar as FigJamToolbar };

type KonvaWindow = Window & { konvaStage?: Konva.Stage };
