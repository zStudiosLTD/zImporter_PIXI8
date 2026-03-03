import { ZContainer } from "./ZContainer";
import { FederatedPointerEvent } from "pixi.js";
export declare class ZSlider extends ZContainer {
    dragging: boolean;
    sliderWidth: number | undefined;
    callback?: (t: number) => void;
    onDragStartBinded: any;
    onDragEndBinded: any;
    onDragBinded: any;
    /**
     * Initialises the slider: resolves the `handle` and `track` children,
     * measures the track width, binds drag handlers, and attaches listeners to
     * the handle.
     */
    init(): void;
    getType(): string;
    /**
     * Programmatically moves the handle to the given normalised position and
     * fires the callback.
     * @param t - A value in [0, 1] representing the handle position across the track.
     */
    setHandlePosition(t: number): void;
    setCallback(callback: (t: number) => void): void;
    removeCallback(): void;
    onDragStart(_e: FederatedPointerEvent): void;
    onDragEnd(_e: FederatedPointerEvent): void;
    /**
     * Handles pointer movement during a drag.
     * Supports PIXI FederatedPointerEvent (v8: .global), PointerEvent, and TouchEvent.
     */
    onDrag(e: FederatedPointerEvent | PointerEvent | TouchEvent): void;
}
//# sourceMappingURL=ZSlider.d.ts.map