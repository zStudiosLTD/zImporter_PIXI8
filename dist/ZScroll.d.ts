import { Graphics, FederatedPointerEvent } from "pixi.js";
import { ZContainer } from "./ZContainer";
export declare class ZScroll extends ZContainer {
    scrollBarHeight: number;
    contentHeight: number;
    /** Local-space Y at drag start (converted from global via toLocal). */
    dragStartY: number;
    beedStartY: number;
    isDragging: boolean;
    isBeedDragging: boolean;
    beed: ZContainer;
    scrollBar: ZContainer;
    scrollContent: ZContainer;
    msk: Graphics | null;
    scrollArea: Graphics | null;
    scrollingEnabled: boolean;
    private onPointerDownBinded;
    private onPointerMoveBinded;
    private onPointerUpBinded;
    private onBeedDownBinded;
    private onBeedUpBinded;
    private onWheelBinded;
    private onBeedNativeMoveBinded;
    private onBeedNativeUpBinded;
    /**
     * Initialises the scroll component: resolves the required children (`beed`,
     * `scrollBar`, `scrollContent`), binds event handlers, and calculates the
     * initial scroll bar dimensions.
     */
    init(): void;
    getType(): string;
    /**
     * (Re-)calculates the scroll bar, mask, and interactive scroll area based on
     * the current dimensions of `scrollBar` and `scrollContent`.
     */
    private calculateScrollBar;
    /**
     * Forwards pointer events from interactive children (`ZButton`, `ZToggle`)
     * inside `scrollContent` to the `scrollArea`, so dragging over a button
     * still scrolls the list.
     */
    private enableChildPassThrough;
    addEventListeners(): void;
    removeEventListeners(): void;
    removeListeners(): void;
    onPointerDown(event: FederatedPointerEvent): void;
    onBeedDown(event: FederatedPointerEvent): void;
    onPointerMove(event: FederatedPointerEvent): void;
    /** Ends the scroll-area drag. */
    onPointerUp(): void;
    /** Ends the beed (thumb) drag. */
    onBeedUp(): void;
    /**
     * Scrolls the content in response to a mouse-wheel event.
     */
    onWheel(event: WheelEvent): void;
    /**
     * Only recalculate when children are present (scrollBar/scrollContent
     * assigned). applyTransform fires during setInstanceData, before children
     * exist; calculateScrollBar's height guard handles that case gracefully.
     */
    applyTransform(): void;
}
//# sourceMappingURL=ZScroll.d.ts.map