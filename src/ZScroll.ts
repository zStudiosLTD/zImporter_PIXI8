import { Graphics, FederatedPointerEvent, Point } from "pixi.js";
import { ZContainer } from "./ZContainer";

export class ZScroll extends ZContainer {
    scrollBarHeight: number = 0;
    contentHeight: number = 0;
    dragStartY = 0;
    beedStartY = 0;
    isDragging = false;
    isBeedDragging = false;
    beed!: ZContainer;
    scrollBar!: ZContainer;
    scrollContent!: ZContainer;
    msk: Graphics | null = null;
    scrollArea: Graphics | null = null;
    scrollingEnabled: boolean = true;

    private onPointerDownBinded: any;
    private onPointerMoveBinded: any;
    private onPointerUpBinded: any;
    private onBeedDownBinded: any;
    private onBeedUpBinded: any;
    private onWheelBinded: any;

    /**
     * Initialises the scroll component: resolves the required children (`beed`,
     * `scrollBar`, `scrollContent`), binds event handlers, and calculates the
     * initial scroll bar dimensions.
     */
    init(): void {
        super.init();

        this.onPointerDownBinded = this.onPointerDown.bind(this);
        this.onPointerMoveBinded = this.onPointerMove.bind(this);
        this.onPointerUpBinded = this.onPointerUp.bind(this);
        this.onBeedDownBinded = this.onBeedDown.bind(this);
        this.onBeedUpBinded = this.onBeedUp.bind(this);
        this.onWheelBinded = this.onWheel.bind(this);

        this.beed = this.getChildByName("beed") as ZContainer;
        this.scrollBar = this.getChildByName("scrollBar") as ZContainer;
        this.scrollContent = this.getChildByName("scrollContent") as ZContainer;
        if (!this.beed || !this.scrollBar || !this.scrollContent) {
            console.warn(
                "ZScroll requires 'beed', 'scrollBar', and 'scrollContent' children."
            );
            return;
        }

        this.calculateScrollBar();
    }

    getType(): string {
        return "ZScroll";
    }

    /**
     * (Re-)calculates the scroll bar, mask, and interactive scroll area based on
     * the current dimensions of `scrollBar` and `scrollContent`.
     */
    private calculateScrollBar(): void {
        if (!this.scrollBar || !this.scrollContent) {
            return;
        }

        const scrollBarHeight = this.scrollBar.height;
        const contentHeight = this.scrollContent.height;

        // Clean up old mask & scroll area before rebuilding
        if (this.msk) {
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

        if (contentHeight <= scrollBarHeight) {
            this.scrollBar.setVisible(false);
            this.scrollContent.y = 0;
            return;
        }

        this.scrollBar.setVisible(true);
        const w = this.scrollBar.x - this.scrollContent.x;

        // PIXI v8 Graphics API: use method chaining with rect().fill()
        this.msk = new Graphics();
        this.msk.name = "mask";
        this.msk.rect(0, 0, w, scrollBarHeight).fill({ color: 0x000000, alpha: 0.5 });

        this.scrollContent.mask = this.msk;
        this.addChild(this.msk);

        this.scrollArea = new Graphics();
        this.scrollArea.name = "scrollArea";
        this.scrollArea.rect(0, 0, w, scrollBarHeight).fill({ color: 0x000000, alpha: 0.5 });
        this.addChildAt(this.scrollArea, 0);
        this.scrollArea.interactive = true;

        this.scrollContent.y = 0;
        this.scrollBar.y = 0;

        this.addEventListeners();
        this.enableChildPassThrough();
    }

    /**
     * Forwards pointer events from interactive children (`ZButton`, `ZToggle`)
     * inside `scrollContent` to the `scrollArea`.
     */
    private enableChildPassThrough(): void {
        const scrollContent = this.scrollContent;
        const scrollArea = this.scrollArea;
        const types: string[] = ["ZToggle", "ZButton"];
        for (const type of types) {
            const allButtons = scrollContent.getAllOfType(type) as ZContainer[];
            for (let i = 0; i < allButtons.length; i++) {
                const child = allButtons[i];
                child.on("pointerdown", (event) => {
                    scrollArea!.emit("pointerdown", event);
                });
                child.on("ontouchstart", (event) => {
                    scrollArea!.emit("ontouchstart", event);
                });
                child.on("pointerup", (event) => {
                    scrollArea!.emit("pointerup", event);
                });
                child.on("ontouchend", (event) => {
                    scrollArea!.emit("ontouchend", event);
                });
                child.on("pointerupoutside", (event) => {
                    scrollArea!.emit("pointerupoutside", event);
                });
                child.on("ontouchendoutside", (event) => {
                    scrollArea!.emit("ontouchendoutside", event);
                });
                child.on("pointermove", (event) => {
                    scrollArea!.emit("pointermove", event);
                });
                child.on("ontouchmove", (event) => {
                    scrollArea!.emit("ontouchmove", event);
                });
            }
        }
    }

    addEventListeners(): void {
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

        this.beed.interactive = true;
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

    removeEventListeners(): void {
        this.scrollArea?.removeAllListeners();
        this.beed?.removeAllListeners();
        document.body.removeEventListener("wheel", this.onWheelBinded);
    }

    public removeListeners(): void {
        this.removeEventListeners();
    }

    /**
     * Begins a drag on the scroll area.
     * PIXI v8: event.global replaces event.data.global
     */
    onPointerDown(event: FederatedPointerEvent): void {
        this.isDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = event.global.y;
        this.beedStartY = this.beed.y;
    }

    onBeedDown(event: FederatedPointerEvent): void {
        this.isBeedDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = event.global.y;
        this.beedStartY = this.beed.y;
    }

    onPointerMove(event: FederatedPointerEvent): void {
        if (this.isDragging || this.isBeedDragging) {
            const currentY = event.global.y;
            const sensitivity = 2;
            const deltaY = this.isDragging
                ? (this.dragStartY - currentY) * sensitivity
                : (currentY - this.dragStartY) * sensitivity;

            this.beed.y = this.beedStartY + deltaY;

            if (this.beed.y < 0) this.beed.y = 0;
            if (this.beed.y > this.scrollBarHeight - this.beed.height)
                this.beed.y = this.scrollBarHeight - this.beed.height;

            const per =
                this.beed.y / (this.scrollBarHeight - this.beed.height);
            this.scrollContent.y =
                -per * (this.scrollContent.height - this.scrollBarHeight);

            event.stopPropagation();
        }
    }

    onPointerUp(): void {
        this.isDragging = false;
    }

    onBeedUp(): void {
        this.isBeedDragging = false;
    }

    onWheel(event: WheelEvent): void {
        if (!this.scrollingEnabled) {
            return;
        }
        const delta = -event.deltaY * 0.5;
        this.scrollBarHeight = this.scrollBar.height;
        this.beed.y -= delta;
        if (this.beed.y < 0) this.beed.y = 0;
        if (this.beed.y > this.scrollBarHeight - this.beed.height)
            this.beed.y = this.scrollBarHeight - this.beed.height;

        const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
        this.scrollContent.y =
            -per * (this.scrollContent.height - this.scrollBarHeight);

        event.stopPropagation();
    }

    applyTransform(): void {
        super.applyTransform();
        this.calculateScrollBar();
    }
}
