# Filtered Canvas Codebase Tree

```
.
├── scripts
│   ├── bundle-analyzer.cjs
│   ├── bundle-analyzer.js
│   ├── check-forbidden-packages.cjs
│   ├── deps-edges.mjs
│   ├── deps-metrics.mjs
│   ├── deps-render.mjs
│   ├── desktop-e2e-smoke.mjs
│   ├── edges-to-dot.mjs
│   └── generate-tree.sh
├── src
│   ├── app
│   │   ├── bootstrap
│   │   │   └── storeBridge.ts
│   │   ├── components
│   │   │   └── CanvasErrorBoundary.tsx
│   │   └── pages
│   │       └── Canvas.tsx
│   ├── features
│   │   └── canvas
│   │       ├── components
│   │       │   ├── colorPicker
│   │       │   │   └── constants.ts
│   │       │   ├── figjam
│   │       │   │   └── hooks
│   │       │   │       ├── useCanvasEvents.ts
│   │       │   │       ├── useCanvasServices.tsx
│   │       │   │       ├── useCanvasShortcuts.ts
│   │       │   │       ├── useCanvasStageLifecycle.ts
│   │       │   │       ├── useCanvasTools.tsx
│   │       │   │       └── useCanvasViewportSync.ts
│   │       │   ├── menus
│   │       │   │   ├── MindmapContextMenu.tsx
│   │       │   │   └── MindmapContextMenuManager.tsx
│   │       │   ├── table
│   │       │   │   ├── TableConfirmationDialog.tsx
│   │       │   │   ├── TableContextMenu.tsx
│   │       │   │   ├── TableContextMenuHelper.ts
│   │       │   │   ├── TableContextMenuManager.tsx
│   │       │   │   ├── TableIntegrationExample.ts
│   │       │   │   └── TableSpatialFeedback.tsx
│   │       │   ├── tools
│   │       │   │   ├── content
│   │       │   │   │   ├── ImageTool.tsx
│   │       │   │   │   ├── MindmapTool.tsx
│   │       │   │   │   ├── TableTool.tsx
│   │       │   │   │   └── TextTool.tsx
│   │       │   │   ├── creation
│   │       │   │   │   ├── ConnectorTool.tsx
│   │       │   │   │   └── StickyNoteTool.tsx
│   │       │   │   ├── drawing
│   │       │   │   │   ├── EraserTool.tsx
│   │       │   │   │   ├── HighlighterTool.tsx
│   │       │   │   │   ├── MarkerTool.tsx
│   │       │   │   │   └── PenTool.tsx
│   │       │   │   ├── navigation
│   │       │   │   │   ├── hooks
│   │       │   │   │   │   ├── useMarqueeDrag.ts
│   │       │   │   │   │   ├── useMarqueeSelection.ts
│   │       │   │   │   │   └── useMarqueeState.ts
│   │       │   │   │   ├── MarqueeSelectionTool.tsx
│   │       │   │   │   └── PanTool.tsx
│   │       │   │   ├── selection
│   │       │   │   │   └── ImageDragHandler.ts
│   │       │   │   ├── shapes
│   │       │   │   │   └── CircleTool.tsx
│   │       │   │   └── StageSelectionHandler.tsx
│   │       │   ├── CanvasContextMenu.tsx
│   │       │   ├── CanvasContextMenuManager.tsx
│   │       │   ├── ContextualToolbar.tsx
│   │       │   ├── ErrorBoundary.tsx
│   │       │   ├── FigJamCanvas.tsx
│   │       │   ├── GridRenderer.ts
│   │       │   ├── index.ts
│   │       │   ├── PerformanceDashboard.tsx
│   │       │   ├── PerformanceOverlayHUD.tsx
│   │       │   ├── SmartGuides.ts
│   │       │   ├── TextEditorOverlay.tsx
│   │       │   ├── UnifiedColorPicker.tsx
│   │       │   └── ZoomControls.tsx
│   │       ├── constants
│   │       │   └── TextConstants.ts
│   │       ├── hooks
│   │       │   ├── CanvasEventContext.tsx
│   │       │   ├── canvasEventTypes.ts
│   │       │   ├── useCanvasEventManager.ts
│   │       │   ├── useCanvasEvents.ts
│   │       │   ├── useCanvasHistory.ts
│   │       │   ├── useCanvasHistoryHelpers.ts
│   │       │   ├── useCanvasSetup.ts
│   │       │   ├── useCanvasSizing.ts
│   │       │   ├── useConsistentText.ts
│   │       │   ├── useKeyboardShortcuts.ts
│   │       │   ├── useMemoryCleanup.ts
│   │       │   ├── useRAFManager.ts
│   │       │   ├── useSelectionManager.ts
│   │       │   ├── useSmartGuidesIntegration.ts
│   │       │   ├── useSpatialIndex.ts
│   │       │   ├── useTableKeyboard.ts
│   │       │   ├── useTauriCanvas.ts
│   │       │   ├── useTauriFileOperations.ts
│   │       │   └── useViewportControls.ts
│   │       ├── managers
│   │       │   ├── animation
│   │       │   │   └── ElementAnimations.ts
│   │       │   ├── interaction
│   │       │   │   └── TransformCommit.ts
│   │       │   ├── overlay
│   │       │   │   └── SpacingHUD.ts
│   │       │   ├── ConnectorSelectionManager.ts
│   │       │   ├── SelectionManager.ts
│   │       │   ├── ToolManager.ts
│   │       │   └── TransformerManager.ts
│   │       ├── plugins
│   │       │   ├── CanvasLayerManager.ts
│   │       │   └── PluginArchitecture.ts
│   │       ├── quality
│   │       │   ├── accessibility
│   │       │   │   ├── AccessibilityManager.ts
│   │       │   │   ├── KeyboardNavigation.ts
│   │       │   │   └── ScreenReaderUtils.ts
│   │       │   └── monitoring
│   │       │       ├── canvasMonitor.ts
│   │       │       └── index.ts
│   │       ├── renderer
│   │       │   ├── modules
│   │       │   │   ├── mindmap
│   │       │   │   │   ├── branchStyle.ts
│   │       │   │   │   ├── MindmapDragLogic.ts
│   │       │   │   │   ├── MindmapEdgeRenderer.ts
│   │       │   │   │   ├── MindmapEventHandlers.ts
│   │       │   │   │   └── MindmapNodeRenderer.ts
│   │       │   │   ├── selection
│   │       │   │   │   ├── controllers
│   │       │   │   │   │   ├── ConnectorTransformFinalizer.ts
│   │       │   │   │   │   ├── MarqueeSelectionController.ts
│   │       │   │   │   │   ├── MindmapController.ts
│   │       │   │   │   │   ├── TransformController.ts
│   │       │   │   │   │   └── TransformLifecycleCoordinator.ts
│   │       │   │   │   ├── managers
│   │       │   │   │   │   ├── ConnectorSelectionManager.ts
│   │       │   │   │   │   ├── ElementSynchronizer.ts
│   │       │   │   │   │   ├── index.ts
│   │       │   │   │   │   ├── MindmapSelectionManager.ts
│   │       │   │   │   │   ├── ShapeTextSynchronizer.ts
│   │       │   │   │   │   └── TransformStateManager.ts
│   │       │   │   │   ├── utils
│   │       │   │   │   │   └── SelectionDebouncer.ts
│   │       │   │   │   ├── SelectionResolver.ts
│   │       │   │   │   └── types.ts
│   │       │   │   ├── sticky-note
│   │       │   │   │   ├── StickyEventHandlers.ts
│   │       │   │   │   ├── StickyRenderingEngine.ts
│   │       │   │   │   └── StickyTextEditor.ts
│   │       │   │   ├── table
│   │       │   │   │   ├── TableCellResolver.ts
│   │       │   │   │   ├── TableEditorManager.ts
│   │       │   │   │   ├── TableEventHandlers.ts
│   │       │   │   │   ├── TableRenderingEngine.ts
│   │       │   │   │   └── tableTypes.ts
│   │       │   │   ├── ConnectorModule.ts
│   │       │   │   ├── ConnectorRenderer.ts
│   │       │   │   ├── ConnectorRendererAdapter.ts
│   │       │   │   ├── connectorWire.ts
│   │       │   │   ├── DrawingModule.ts
│   │       │   │   ├── DrawingRenderer.ts
│   │       │   │   ├── ImageRenderer.ts
│   │       │   │   ├── ImageRendererAdapter.ts
│   │       │   │   ├── imageTransform.ts
│   │       │   │   ├── MindmapRenderer.ts
│   │       │   │   ├── MindmapRendererAdapter.ts
│   │       │   │   ├── mindmapRouting.ts
│   │       │   │   ├── mindmapWire.ts
│   │       │   │   ├── PortHoverModule.ts
│   │       │   │   ├── SelectionModule.ts
│   │       │   │   ├── ShapeModule.ts
│   │       │   │   ├── ShapeRenderer.ts
│   │       │   │   ├── ShapeTextRenderer.ts
│   │       │   │   ├── StickyNoteModule.ts
│   │       │   │   ├── TableModule.ts
│   │       │   │   ├── TableModuleAdapter.ts
│   │       │   │   ├── tableTransform.ts
│   │       │   │   ├── TableTransformerAdapter.ts
│   │       │   │   ├── TableTransformerController.ts
│   │       │   │   ├── TextModule.ts
│   │       │   │   ├── TextRenderer.ts
│   │       │   │   ├── ToolPreviewLayer.ts
│   │       │   │   └── ViewportRenderer.ts
│   │       │   ├── index.ts
│   │       │   ├── layers.ts
│   │       │   ├── TransformerController.ts
│   │       │   └── types.ts
│   │       ├── services
│   │       │   ├── ConnectorService.ts
│   │       │   ├── TauriCanvasOptimizations.ts
│   │       │   └── TauriFileService.ts
│   │       ├── stores
│   │       │   ├── modules
│   │       │   │   ├── history
│   │       │   │   │   ├── memoryManager.ts
│   │       │   │   │   ├── types.ts
│   │       │   │   │   └── utils.ts
│   │       │   │   ├── operations
│   │       │   │   │   ├── ElementOperations.ts
│   │       │   │   │   ├── SelectionOperations.ts
│   │       │   │   │   ├── utils.ts
│   │       │   │   │   └── ViewportOperations.ts
│   │       │   │   ├── coreModule.ts
│   │       │   │   ├── historyModule.ts
│   │       │   │   ├── interactionModule.ts
│   │       │   │   └── types.ts
│   │       │   ├── facade.ts
│   │       │   ├── selectors.ts
│   │       │   └── unifiedCanvasStore.ts
│   │       ├── toolbar
│   │       │   ├── CanvasToolbar.tsx
│   │       │   ├── index.ts
│   │       │   └── ShapesDropdown.tsx
│   │       ├── tools
│   │       │   ├── CanvasContextMenuTool.ts
│   │       │   ├── EraserTool.ts
│   │       │   ├── MindmapContextMenuTool.ts
│   │       │   └── TableContextMenuTool.ts
│   │       ├── types
│   │       │   ├── connector.ts
│   │       │   ├── connectorTool.ts
│   │       │   ├── image.ts
│   │       │   ├── mindmap.ts
│   │       │   ├── table.ts
│   │       │   └── text.ts
│   │       └── utils
│   │           ├── alignment
│   │           │   ├── SmartGuidesDetection.ts
│   │           │   └── SnapGuides.ts
│   │           ├── anchors
│   │           │   └── AnchorSnapping.ts
│   │           ├── connectors
│   │           │   └── LiveRouting.ts
│   │           ├── editors
│   │           │   ├── openCellEditorWithTracking.ts
│   │           │   ├── openMindmapNodeEditor.ts
│   │           │   ├── openShapeTextEditor.ts
│   │           │   └── openStandaloneTextEditor.ts
│   │           ├── image
│   │           │   └── ImageLoader.ts
│   │           ├── mindmap
│   │           │   └── mindmapOperations.ts
│   │           ├── performance
│   │           │   ├── cursorManager.ts
│   │           │   ├── emergencyRafBatcher.ts
│   │           │   ├── index.ts
│   │           │   ├── MemoryManager.ts
│   │           │   ├── performanceLogger.ts
│   │           │   ├── performanceMonitor.ts
│   │           │   ├── performanceTracker.ts
│   │           │   ├── ProductionKonvaOptimizer.ts
│   │           │   ├── ProductionPerformanceBudgets.ts
│   │           │   ├── QuadTree.ts
│   │           │   ├── RafBatcher.ts
│   │           │   ├── ShapeCaching.ts
│   │           │   └── ViewportCulling.ts
│   │           ├── spatial
│   │           │   ├── index.ts
│   │           │   ├── simpleEraserIndex.ts
│   │           │   └── spatialQuadTree.ts
│   │           ├── table
│   │           │   └── tableOperations.ts
│   │           ├── text
│   │           │   ├── computeShapeInnerBox.ts
│   │           │   ├── TextMeasurement.ts
│   │           │   └── vendorStyles.ts
│   │           ├── AnimationIntegration.ts
│   │           ├── AspectRatioConstraint.ts
│   │           ├── clipboard.ts
│   │           ├── DirectKonvaDrawing.ts
│   │           ├── distribute.ts
│   │           ├── KonvaNodePool.ts
│   │           ├── pointer.ts
│   │           └── viewBounds.ts
│   ├── styles
│   │   └── figjam-theme.css
│   ├── types
│   │   └── global.d.ts
│   ├── utils
│   │   ├── debug.ts
│   │   ├── imageSaveCache.ts
│   │   └── imageStorage.ts
│   ├── index.css
│   └── main.tsx
├── src-tauri
│   ├── capabilities
│   │   └── main.json
│   ├── gen
│   │   └── schemas
│   │       ├── acl-manifests.json
│   │       ├── capabilities.json
│   │       ├── desktop-schema.json
│   │       ├── linux-schema.json
│   │       └── windows-schema.json
│   ├── src
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── build.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── types
│   ├── canvas.ts
│   └── index.ts
├── .dependency-cruiser.cjs
├── .eslintrc.cjs
├── .gitignore
├── Makefile
├── opencode.json
├── package-lock.json
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── vitest.performance.config.ts
```