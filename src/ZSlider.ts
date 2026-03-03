import { ZContainer } from "./ZContainer";
import { FederatedPointerEvent, Point } from "pixi.js";

export class ZSlider extends ZContainer {
    dragging = false;
    sliderWidth: number | undefined = 0;
    callback?: (t: number) => void;
    onDragStartBinded: any;
    onDragEndBinded: any;
    onDragBinded: any;

    /**
     * Initialises the slider: resolves the `handle` and `track` children,
     * measures the track width, binds drag handlers, and attaches listeners to
     * the handle.
     */
    init(): void {
        super.init();

        const handle: ZContainer = this.get("handle") as ZContainer;
        const track: ZContainer = this.get("track") as ZContainer;
        if (!handle || !track) {
            console.error("ZSlider is missing handle or track");
            return;
        }

        this.sliderWidth = track.width;
        this.onDragStartBinded = this.onDragStart.bind(this);
        this.onDragEndBinded = this.onDragEnd.bind(this);
        this.onDragBinded = this.onDrag.bind(this);

        handle
            .on("pointerdown", this.onDragStartBinded)
            .on("touchstart", this.onDragStartBinded);
        handle.cursor = "pointer";
    }

    public getType(): string {
        return "ZSlider";
    }

    /**
     * Programmatically moves the handle to the given normalised position and
     * fires the callback.
     * @param t - A value in [0, 1] representing the handle position across the track.
     */
    setHandlePosition(t: number): void {
        const handle = (this as any).handle;
        handle.x = t * this.sliderWidth!;
        if (this.callback) {
            this.callback(t);
        }
    }

    setCallback(callback: (t: number) => void): void {
        this.callback = callback;
    }

    removeCallback(): void {
        this.callback = undefined;
    }

    onDragStart(_e: FederatedPointerEvent): void {
        this.dragging = true;
        const handle = (this as any).handle;
        handle.on("pointerup", this.onDragEndBinded);
        handle.on("pointerupoutside", this.onDragEndBinded);
        handle.on("touchend", this.onDragEndBinded);
        handle.on("touchendoutside", this.onDragEndBinded);
        window.addEventListener("pointerup", this.onDragEndBinded);
        window.addEventListener("touchend", this.onDragEndBinded);
        window.addEventListener("pointermove", this.onDragBinded);
        window.addEventListener("touchmove", this.onDragBinded);
    }

    onDragEnd(_e: FederatedPointerEvent): void {
        this.dragging = false;
        const handle = (this as any).handle;
        handle.off("pointerup", this.onDragEndBinded);
        handle.off("pointerupoutside", this.onDragEndBinded);
        handle.off("touchend", this.onDragEndBinded);
        handle.off("touchendoutside", this.onDragEndBinded);
        window.removeEventListener("pointerup", this.onDragEndBinded);
        window.removeEventListener("touchend", this.onDragEndBinded);
        window.removeEventListener("pointermove", this.onDragBinded);
        window.removeEventListener("touchmove", this.onDragBinded);
    }

    /**
     * Handles pointer movement during a drag.
     * Supports PIXI FederatedPointerEvent (v8: .global), PointerEvent, and TouchEvent.
     */
    onDrag(e: FederatedPointerEvent | PointerEvent | TouchEvent): void {
        let globalPoint: Point | undefined;

        // PIXI v8: FederatedPointerEvent has .global directly (no .data wrapper)
        if (e instanceof FederatedPointerEvent) {
            globalPoint = e.global as Point;
        } else if ("clientX" in e) {
            globalPoint = new Point(
                (e as PointerEvent).clientX,
                (e as PointerEvent).clientY
            );
        } else if ("touches" in e && (e as TouchEvent).touches.length > 0) {
            globalPoint = new Point(
                (e as TouchEvent).touches[0].clientX,
                (e as TouchEvent).touches[0].clientY
            );
        }

        if (!globalPoint) return;

        const handle = (this as any).handle;
        const local = handle.parent.toLocal(globalPoint);
        const minX = 0;
        const maxX = this.sliderWidth!;
        const clampedX = Math.max(minX, Math.min(local.x, maxX));
        handle.x = clampedX;

        const t = (handle.x - handle.pivot.x) / this.sliderWidth!;
        if (this.callback) {
            this.callback(t);
        }
        if ("stopPropagation" in e && typeof e.stopPropagation === "function") {
            e.stopPropagation();
        }
    }
}
