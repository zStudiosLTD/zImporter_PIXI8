import { ZContainer } from "./ZContainer";
import { FederatedPointerEvent, Point } from "pixi.js";
export class ZSlider extends ZContainer {
    dragging = false;
    sliderWidth = 0;
    callback;
    onDragStartBinded;
    onDragEndBinded;
    onDragBinded;
    /**
     * Initialises the slider: resolves the `handle` and `track` children,
     * measures the track width, binds drag handlers, and attaches listeners to
     * the handle.
     */
    init() {
        super.init();
        const handle = this.get("handle");
        const track = this.get("track");
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
    getType() {
        return "ZSlider";
    }
    /**
     * Programmatically moves the handle to the given normalised position and
     * fires the callback.
     * @param t - A value in [0, 1] representing the handle position across the track.
     */
    setHandlePosition(t) {
        const handle = this.handle;
        handle.x = t * this.sliderWidth;
        if (this.callback) {
            this.callback(t);
        }
    }
    setCallback(callback) {
        this.callback = callback;
    }
    removeCallback() {
        this.callback = undefined;
    }
    onDragStart(_e) {
        this.dragging = true;
        const handle = this.handle;
        handle.on("pointerup", this.onDragEndBinded);
        handle.on("pointerupoutside", this.onDragEndBinded);
        handle.on("touchend", this.onDragEndBinded);
        handle.on("touchendoutside", this.onDragEndBinded);
        window.addEventListener("pointerup", this.onDragEndBinded);
        window.addEventListener("touchend", this.onDragEndBinded);
        window.addEventListener("pointermove", this.onDragBinded);
        window.addEventListener("touchmove", this.onDragBinded);
    }
    onDragEnd(_e) {
        this.dragging = false;
        const handle = this.handle;
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
    onDrag(e) {
        let globalPoint;
        // PIXI v8: FederatedPointerEvent has .global directly (no .data wrapper)
        if (e instanceof FederatedPointerEvent) {
            globalPoint = e.global;
        }
        else if ("clientX" in e) {
            globalPoint = new Point(e.clientX, e.clientY);
        }
        else if ("touches" in e && e.touches.length > 0) {
            globalPoint = new Point(e.touches[0].clientX, e.touches[0].clientY);
        }
        if (!globalPoint)
            return;
        const handle = this.handle;
        const local = handle.parent.toLocal(globalPoint);
        const minX = 0;
        const maxX = this.sliderWidth;
        const clampedX = Math.max(minX, Math.min(local.x, maxX));
        handle.x = clampedX;
        const t = (handle.x - handle.pivot.x) / this.sliderWidth;
        if (this.callback) {
            this.callback(t);
        }
        if ("stopPropagation" in e && typeof e.stopPropagation === "function") {
            e.stopPropagation();
        }
    }
}
//# sourceMappingURL=ZSlider.js.map