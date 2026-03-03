import { Graphics, FederatedPointerEvent } from "pixi.js";
import { ZContainer } from "./ZContainer";
export declare class ZScroll extends ZContainer {
    scrollBarHeight: number;
    contentHeight: number;
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
     * inside `scrollContent` to the `scrollArea`.
     */
    private enableChildPassThrough;
    addEventListeners(): void;
    removeEventListeners(): void;
    removeListeners(): void;
    /**
     * Begins a drag on the scroll area.
     * PIXI v8: event.global replaces event.data.global
     */
    onPointerDown(event: FederatedPointerEvent): void;
    onBeedDown(event: FederatedPointerEvent): void;
    onPointerMove(event: FederatedPointerEvent): void;
    onPointerUp(): void;
    onBeedUp(): void;
    onWheel(event: WheelEvent): void;
    applyTransform(): void;
}
//# sourceMappingURL=ZScroll.d.ts.map