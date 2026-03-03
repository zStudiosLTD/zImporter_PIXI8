import { Graphics } from "pixi.js";
import { ZContainer } from "./ZContainer";
export class ZScroll extends ZContainer {
    scrollBarHeight = 0;
    contentHeight = 0;
    /** Local-space Y at drag start (converted from global via toLocal). */
    dragStartY = 0;
    beedStartY = 0;
    isDragging = false;
    isBeedDragging = false;
    beed;
    scrollBar;
    scrollContent;
    msk = null;
    scrollArea = null;
    scrollingEnabled = true;
    onPointerDownBinded;
    onPointerMoveBinded;
    onPointerUpBinded;
    onBeedDownBinded;
    onBeedUpBinded;
    onWheelBinded;
    // Native window listeners used during beed drag so movement outside the beed's
    // hit area is still captured (PIXI pointermove stops when pointer leaves the object).
    onBeedNativeMoveBinded = null;
    onBeedNativeUpBinded = null;
    /**
     * Initialises the scroll component: resolves the required children (`beed`,
     * `scrollBar`, `scrollContent`), binds event handlers, and calculates the
     * initial scroll bar dimensions.
     */
    init() {
        super.init();
        this.onPointerDownBinded = this.onPointerDown.bind(this);
        this.onPointerMoveBinded = this.onPointerMove.bind(this);
        this.onPointerUpBinded = this.onPointerUp.bind(this);
        this.onBeedDownBinded = this.onBeedDown.bind(this);
        this.onBeedUpBinded = this.onBeedUp.bind(this);
        this.onWheelBinded = this.onWheel.bind(this);
        this.beed = this.getChildByName("beed", true);
        this.scrollBar = this.getChildByName("scrollBar", true);
        this.scrollContent = this.getChildByName("scrollContent", true);
        if (!this.beed || !this.scrollBar || !this.scrollContent) {
            console.warn("ZScroll requires 'beed', 'scrollBar', and 'scrollContent' children.");
            return;
        }
        this.calculateScrollBar();
    }
    getType() {
        return "ZScroll";
    }
    /**
     * (Re-)calculates the scroll bar, mask, and interactive scroll area based on
     * the current dimensions of `scrollBar` and `scrollContent`.
     */
    calculateScrollBar() {
        if (!this.scrollBar || !this.scrollContent)
            return;
        const scrollBarHeight = this.scrollBar.height;
        // CRITICAL: remove any existing mask BEFORE measuring contentHeight.
        // In PIXI v8 getBounds() (and thus .height) clips to the mask bounds,
        // so if the mask is still applied we'd measure the viewport height
        // instead of the full content height.
        if (this.msk) {
            this.scrollContent.mask = null;
            this.msk.removeAllListeners();
            this.msk.removeFromParent();
            this.msk.destroy({ children: true });
            this.msk = null;
        }
        if (this.scrollArea) {
            this.scrollArea.removeAllListeners();
            this.scrollArea.removeFromParent();
            this.scrollArea.destroy({ children: true });
            this.scrollArea = null;
        }
        const contentHeight = this.scrollContent.height;
        console.log(`[ZScroll] scrollBarHeight=${scrollBarHeight} contentHeight=${contentHeight}`);
        if (scrollBarHeight === 0 && contentHeight === 0)
            return;
        if (contentHeight <= scrollBarHeight) {
            console.log("[ZScroll] content fits, no scroll needed.");
            this.scrollBar.setVisible(false);
            this.scrollContent.y = 0;
            return;
        }
        this.scrollBar.setVisible(true);
        const w = this.scrollBar.x - this.scrollContent.x;
        // Mask at (0,0) — scrollContent.y is always reset to 0 below.
        this.msk = new Graphics();
        this.msk.label = "mask";
        this.msk.rect(0, 0, w, scrollBarHeight).fill(0x000000);
        this.addChild(this.msk);
        this.scrollContent.mask = this.msk;
        // Invisible hit region for drag events.
        this.scrollArea = new Graphics();
        this.scrollArea.label = "scrollArea";
        this.scrollArea.rect(0, 0, w, scrollBarHeight).fill({ color: 0x000000, alpha: 0.001 });
        this.addChildAt(this.scrollArea, 0);
        this.scrollArea.eventMode = "static"; // v8: replaces .interactive = true
        this.scrollContent.y = 0;
        this.scrollBar.y = 0;
        // Cache content height — measured before mask was applied.
        this.contentHeight = contentHeight;
        console.log(`[ZScroll] w=${w} contentHeight=${contentHeight} beed.height=${this.beed?.height} beedMax=${scrollBarHeight - (this.beed?.height ?? 0)}`);
        this.addEventListeners();
        this.enableChildPassThrough();
    }
    /**
     * Forwards pointer events from interactive children (`ZButton`, `ZToggle`)
     * inside `scrollContent` to the `scrollArea`, so dragging over a button
     * still scrolls the list.
     */
    enableChildPassThrough() {
        const scrollContent = this.scrollContent;
        const scrollArea = this.scrollArea;
        const types = ["ZToggle", "ZButton"];
        for (const type of types) {
            const allButtons = scrollContent.getAllOfType(type);
            for (let i = 0; i < allButtons.length; i++) {
                const child = allButtons[i];
                child.on("pointerdown", (event) => {
                    scrollArea.emit("pointerdown", event);
                });
                child.on("ontouchstart", (event) => {
                    scrollArea.emit("ontouchstart", event);
                });
                child.on("pointerup", (event) => {
                    scrollArea.emit("pointerup", event);
                });
                child.on("ontouchend", (event) => {
                    scrollArea.emit("ontouchend", event);
                });
                child.on("pointerupoutside", (event) => {
                    scrollArea.emit("pointerupoutside", event);
                });
                child.on("ontouchendoutside", (event) => {
                    scrollArea.emit("ontouchendoutside", event);
                });
                child.on("pointermove", (event) => {
                    scrollArea.emit("pointermove", event);
                });
                child.on("ontouchmove", (event) => {
                    scrollArea.emit("ontouchmove", event);
                });
            }
        }
    }
    addEventListeners() {
        this.removeEventListeners();
        if (this.scrollArea) {
            this.scrollArea.on("pointerdown", this.onPointerDownBinded);
            this.scrollArea.on("pointermove", this.onPointerMoveBinded);
            this.scrollArea.on("pointerup", this.onPointerUpBinded);
            this.scrollArea.on("pointerupoutside", this.onPointerUpBinded);
            this.scrollArea.on("touchstart", this.onPointerDownBinded);
            this.scrollArea.on("touchmove", this.onPointerMoveBinded);
            this.scrollArea.on("touchend", this.onPointerUpBinded);
            this.scrollArea.on("touchendoutside", this.onPointerUpBinded);
        }
        // PIXI v8: use eventMode instead of deprecated .interactive
        this.beed.eventMode = "static";
        this.beed.on("pointerdown", this.onBeedDownBinded);
        this.beed.on("pointermove", this.onPointerMoveBinded);
        this.beed.on("pointerup", this.onBeedUpBinded);
        this.beed.on("pointerupoutside", this.onBeedUpBinded);
        this.beed.on("touchstart", this.onBeedDownBinded);
        this.beed.on("touchmove", this.onPointerMoveBinded);
        this.beed.on("touchend", this.onBeedUpBinded);
        this.beed.on("touchendoutside", this.onBeedUpBinded);
        document.body.addEventListener("wheel", this.onWheelBinded);
    }
    removeEventListeners() {
        this.scrollArea?.removeAllListeners();
        this.beed?.removeAllListeners();
        document.body.removeEventListener("wheel", this.onWheelBinded);
        if (this.onBeedNativeMoveBinded) {
            window.removeEventListener("mousemove", this.onBeedNativeMoveBinded);
            window.removeEventListener("touchmove", this.onBeedNativeMoveBinded);
            this.onBeedNativeMoveBinded = null;
        }
        if (this.onBeedNativeUpBinded) {
            window.removeEventListener("mouseup", this.onBeedNativeUpBinded);
            window.removeEventListener("touchend", this.onBeedNativeUpBinded);
            this.onBeedNativeUpBinded = null;
        }
    }
    removeListeners() {
        this.removeEventListeners();
    }
    // v8: event.global.y replaces v7's event.data.global.y
    onPointerDown(event) {
        this.isDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = event.global.y;
        this.beedStartY = this.beed.y;
        console.log(`[ZScroll drag] scrollBarHeight=${this.scrollBarHeight} beed.height=${this.beed.height} beedMax=${this.scrollBarHeight - this.beed.height} contentHeight=${this.contentHeight}`);
    }
    onBeedDown(event) {
        this.isBeedDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = event.global.y;
        this.beedStartY = this.beed.y;
        // Attach native window events so the drag continues even when the pointer
        // moves outside the beed's PIXI hit area.
        const onMove = (e) => {
            const clientY = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
            const deltaY = (clientY - this.dragStartY) * 2; // same sensitivity as PIXI path
            this.beed.y = this.beedStartY + deltaY;
            if (this.beed.y < 0)
                this.beed.y = 0;
            if (this.beed.y > this.scrollBarHeight - this.beed.height)
                this.beed.y = this.scrollBarHeight - this.beed.height;
            const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
            this.scrollContent.y = -per * (this.contentHeight - this.scrollBarHeight);
        };
        const onUp = () => {
            this.isBeedDragging = false;
            window.removeEventListener("mousemove", this.onBeedNativeMoveBinded);
            window.removeEventListener("mouseup", this.onBeedNativeUpBinded);
            window.removeEventListener("touchmove", this.onBeedNativeMoveBinded);
            window.removeEventListener("touchend", this.onBeedNativeUpBinded);
            this.onBeedNativeMoveBinded = null;
            this.onBeedNativeUpBinded = null;
        };
        this.onBeedNativeMoveBinded = onMove;
        this.onBeedNativeUpBinded = onUp;
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchmove", onMove);
        window.addEventListener("touchend", onUp);
    }
    onPointerMove(event) {
        if (!this.isDragging && !this.isBeedDragging)
            return;
        const currentY = event.global.y;
        const sensitivity = 2;
        const deltaY = this.isDragging
            ? (this.dragStartY - currentY) * sensitivity // content drag: inverted
            : (currentY - this.dragStartY) * sensitivity; // beed drag: direct
        this.beed.y = this.beedStartY + deltaY;
        if (this.beed.y < 0)
            this.beed.y = 0;
        if (this.beed.y > this.scrollBarHeight - this.beed.height)
            this.beed.y = this.scrollBarHeight - this.beed.height;
        const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
        this.scrollContent.y = -per * (this.contentHeight - this.scrollBarHeight);
        event.stopPropagation();
    }
    /** Ends the scroll-area drag. */
    onPointerUp() {
        this.isDragging = false;
    }
    /** Ends the beed (thumb) drag. */
    onBeedUp() {
        this.isBeedDragging = false;
        // Also clean up the native window listeners if they haven't fired yet.
        if (this.onBeedNativeMoveBinded) {
            window.removeEventListener("mousemove", this.onBeedNativeMoveBinded);
            window.removeEventListener("touchmove", this.onBeedNativeMoveBinded);
            this.onBeedNativeMoveBinded = null;
        }
        if (this.onBeedNativeUpBinded) {
            window.removeEventListener("mouseup", this.onBeedNativeUpBinded);
            window.removeEventListener("touchend", this.onBeedNativeUpBinded);
            this.onBeedNativeUpBinded = null;
        }
    }
    /**
     * Scrolls the content in response to a mouse-wheel event.
     */
    onWheel(event) {
        if (!this.scrollingEnabled) {
            return;
        }
        const delta = -event.deltaY * 0.5;
        this.scrollBarHeight = this.scrollBar.height;
        this.beed.y -= delta;
        if (this.beed.y < 0)
            this.beed.y = 0;
        if (this.beed.y > this.scrollBarHeight - this.beed.height)
            this.beed.y = this.scrollBarHeight - this.beed.height;
        const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
        this.scrollContent.y = -per * (this.contentHeight - this.scrollBarHeight);
        event.stopPropagation();
    }
    /**
     * Only recalculate when children are present (scrollBar/scrollContent
     * assigned). applyTransform fires during setInstanceData, before children
     * exist; calculateScrollBar's height guard handles that case gracefully.
     */
    applyTransform() {
        super.applyTransform();
        if (this.scrollBar && this.scrollContent) {
            this.calculateScrollBar();
        }
    }
}
//# sourceMappingURL=ZScroll.js.map