import * as PIXI from 'pixi.js';
import { InstanceData } from './SceneData';
import { OrientationData } from './SceneData';
import { ZTimeline } from './ZTimeline';
import { Emitter } from "@pixi/particle-emitter";
import { ZNineSlice } from './ZNineSlice';
import TextInput from './text-input';
import { Spine as SpineGameObject } from "@esotericsoftware/spine-pixi-v8";

export interface AnchorData {
    anchorType: string;
    anchorPercentage: {
        x: number;
        y: number;
    };
}

interface TextureSingleBehaviorConfig {
    texture: PIXI.Texture;
    [key: string]: any;
}

interface EmitterBehavior {
    type: string;
    config: TextureSingleBehaviorConfig | { [key: string]: any };
    [key: string]: any;
}

interface EmitterConfig {
    behaviors: EmitterBehavior[];
    [key: string]: any;
}

/**
 * A custom container class extending `PIXI.Container` that supports orientation-based
 * transforms, anchoring, and instance data management for responsive layouts.
 *
 * PIXI v8 notes:
 *  - NineSlicePlane → NineSliceSprite
 *  - eventMode is now a first-class typed property on Container
 */
export class ZContainer extends PIXI.Container {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    resizeable: boolean = true;
    name: string = "";
    _fitToScreen: boolean = false;
    emitter: Emitter | undefined;
    originalTextWidth?: number;
    originalTextHeight?: number;
    originalFontSize?: number;
    fixedBoxSize?: boolean;
    _props?: any;

    /**
     * Performs a breadth-first search and returns the first descendant `ZContainer`
     * with the given name.
     */
    public get(childName: string): ZContainer | null {
        const queue: ZContainer[] = [];

        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                if (child instanceof ZContainer) {
                    queue.push(child);
                }
            }
        }

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.name === childName) {
                return current;
            }

            if (current.children && current.children.length > 0) {
                for (let child of current.children) {
                    if (child instanceof ZContainer) {
                        queue.push(child);
                    }
                }
            }
        }

        return null;
    }

    /**
     * Performs a breadth-first search and returns all descendant `ZContainer`
     * instances with the given name.
     */
    getAll(childName: string): ZContainer[] {
        const queue: ZContainer[] = [];
        const result: ZContainer[] = [];
        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                if (child instanceof ZContainer) {
                    queue.push(child);
                }
            }
        }

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.name === childName) {
                result.push(current);
            }

            if (current.children && current.children.length > 0) {
                for (let child of current.children) {
                    if (child instanceof ZContainer) {
                        queue.push(child);
                    }
                }
            }
        }

        return result as ZContainer[];
    }

    /**
     * Called once all children of the container are loaded.
     * Captures the original text-field dimensions and font size.
     */
    public init(): void {
        let tf: PIXI.Text | TextInput | null = this.getTextField();
        if (tf) {
            if (tf instanceof TextInput || tf instanceof PIXI.BitmapText || !tf.style) {
                return;
            }
            this.setFixedBoxSize(false);
            this.originalTextWidth = tf!.width;
            this.originalTextHeight = tf!.height;
            this.originalFontSize = typeof tf.style.fontSize === 'number'
                ? tf.style.fontSize
                : tf.style.fontSize !== undefined
                    ? parseFloat(tf.style.fontSize)
                    : undefined;
        }
    }

    /** Returns `"ZContainer"`. */
    public getType(): string {
        return "ZContainer";
    }

    /**
     * Enables or disables fixed-box-size mode. When enabled, `setText` will
     * shrink the font size to keep the text within the original measured bounds.
     */
    public setFixedBoxSize(value: boolean): void {
        this.fixedBoxSize = value;
    }

    /**
     * Performs a breadth-first search and returns all descendants that report
     * the given type string via their `getType()` method.
     */
    public getAllOfType(type: string): ZContainer[] {
        const queue: ZContainer[] = [];
        const result: ZContainer[] = [];
        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                if ((child as any).getType) {
                    queue.push(child as ZContainer);
                }
            }
        }

        while (queue.length > 0) {
            const current = queue.shift()!;
            let _t = current.getType();
            if (_t === type) {
                result.push(current);
            }

            if (current.children && current.children.length > 0) {
                for (let child of current.children) {
                    if ((child as any).getType) {
                        queue.push(child as ZContainer);
                    }
                }
            }
        }

        return result as ZContainer[];
    }

    /**
     * Sets the text content of the first text-field child. If fixed-box-size
     * mode is on, the font size will be reduced until the text fits.
     */
    public setText(text: string): void {
        let textChild = this.getTextField();
        if (textChild) {
            if (textChild instanceof PIXI.Text) {
                textChild.resolution = 2;
            }
            textChild.text = text;
            if (textChild instanceof TextInput) {
                return;
            }
            let style = textChild.style;
            if (style) {
                style.fontSize = this.originalFontSize ?? style.fontSize;
                textChild.style = style;
                this.resizeText(textChild);
            }
        }
    }

    /**
     * Merges additional style properties onto the text-field's existing style
     * and re-runs the resize logic to keep the text within bounds.
     */
    public setTextStyle(data: Partial<PIXI.TextStyle>): void {
        let tf = this.getTextField();
        if (tf) {
            if (tf instanceof TextInput || tf instanceof PIXI.BitmapText || !tf.style) {
                return;
            }
            tf.style = { ...tf.style, ...data };
            this.resizeText(tf);
        }
    }

    /** Returns the raw instance-data props object stored via `setInstanceData`. */
    public getProps(): any {
        return this._props;
    }

    /**
     * Shrinks the font size of `textChild` until both its width and height fit
     * within `originalTextWidth` / `originalTextHeight` (only when `fixedBoxSize` is true).
     */
    private resizeText(textChild: PIXI.Text) {
        if (this.fixedBoxSize) {
            let style = textChild.style;
            let maxWidth = this.originalTextWidth;
            let maxHeight = this.originalTextHeight;
            if ((maxWidth !== undefined && maxWidth > 0) || (maxHeight !== undefined && maxHeight > 0)) {
                while (
                    (maxWidth !== undefined && textChild.width > maxWidth) ||
                    (maxHeight !== undefined && textChild.height > maxHeight)
                ) {
                    style = new PIXI.TextStyle({
                        ...style,
                        fontSize: (style.fontSize as number) - 1,
                    });
                    textChild.style = style;
                }
            }
        }
    }

    /**
     * Finds and returns the first text-field child. Prefers a child named
     * `"label"`, then the first `PIXI.Text` or `TextInput` among direct children.
     */
    getTextField(): PIXI.Text | TextInput | null {
        let textChild: PIXI.Text | TextInput = this.getChildByName("label") as PIXI.Text | TextInput;
        if (!textChild) {
            let children = this.children;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (child instanceof PIXI.Text || child instanceof TextInput) {
                    textChild = child;
                    break;
                }
            }
        }

        return textChild;
    }

    /**
     * Applies scene-editor instance data to this container.
     */
    public setInstanceData(data: InstanceData, orientation: string): void {
        this.portrait = data.portrait;
        this.landscape = data.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
        this.name = data.instanceName || "";
        this._props = data;

        if (data.attrs) {
            if (data.attrs.fitToScreen !== undefined) {
                this.fitToScreen = data.attrs.fitToScreen;
            }
        }

        // Text field original size setup
        let tf = this.getTextField();
        if (tf && tf instanceof PIXI.Text) {
            this.setFixedBoxSize(false);
            this.originalTextWidth = tf.width;
            this.originalTextHeight = tf.height;
            this.originalFontSize = typeof tf.style.fontSize === 'number'
                ? tf.style.fontSize
                : tf.style.fontSize !== undefined
                    ? parseFloat(tf.style.fontSize)
                    : undefined;
        }
    }

    /**
     * When set to `true`, stretches this container to fill the entire screen.
     */
    set fitToScreen(value: boolean) {
        this._fitToScreen = value;
        if (value) {
            this.executeFitToScreen();
        } else {
            this.applyTransform();
        }
    }

    get fitToScreen(): boolean {
        return this._fitToScreen;
    }

    /**
     * Reads `currentTransform` (or delegates to `executeFitToScreen`) and
     * writes position, scale, rotation, pivot, alpha, and visibility onto this container.
     */
    applyTransform() {
        if (this._fitToScreen) {
            this.executeFitToScreen();
            return;
        }
        if (!this.currentTransform) return;
        if (!this.resizeable) return;
        if (this.parent) {
            let currentFrame = (this.parent as any).currentFrame;
            if (currentFrame !== undefined && currentFrame > 0) {
                return;
            }
        }

        this.x = this.currentTransform.x || 0;
        this.y = this.currentTransform.y || 0;
        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha;
        this.scale.x = this.currentTransform.scaleX || 1;
        this.scale.y = this.currentTransform.scaleY || 1;
        this.pivot.x = this.currentTransform.pivotX || 0;
        this.pivot.y = this.currentTransform.pivotY || 0;
        this.visible = this.currentTransform.visible !== false;
        // Apply Flash skew: skewY is Flash's X-axis angle (PIXI skew.y = skewY - rotation).
        // Flash skewX is the Y-axis angle (PIXI skew.x = rotation - skewX).
        if (this.currentTransform.skewY !== undefined) {
            this.skew.y = this.currentTransform.skewY - this.rotation;
        } else {
            this.skew.y = 0;
        }
        if (this.currentTransform.skewX !== undefined) {
            this.skew.x = this.rotation - this.currentTransform.skewX;
        } else {
            this.skew.x = 0;
        }
        this.applyAnchor();
    }

    /**
     * Switches the active orientation data and re-applies the transform.
     */
    public resize(width: number, height: number, orientation: "portrait" | "landscape") {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    /**
     * Stretches this container (or its first `ZNineSlice` child) to cover the
     * full browser viewport.
     */
    executeFitToScreen() {
        let children = this.children;
        if (children.length === 0) return;

        if (this.parent) {
            this.pivotX = 0;
            this.pivotY = 0;

            let pos = this.parent.toLocal(new PIXI.Point(0, 0));
            this.x = pos.x;
            this.y = pos.y;

            if (children[0] instanceof ZNineSlice) {
                let nineSlice = children[0] as ZNineSlice;
                let btmPoint = this.parent.toLocal(new PIXI.Point(window.innerWidth, window.innerHeight));
                nineSlice.width = btmPoint.x - pos.x;
                nineSlice.height = btmPoint.y - pos.y;
            } else {
                if (window.innerWidth > window.innerHeight) {
                    let rightPoint = this.parent.toLocal(new PIXI.Point(window.innerWidth, 0));
                    this.width = rightPoint.x - pos.x;
                    this.scaleY = this.scaleX;
                } else {
                    let btmPoint = this.parent.toLocal(new PIXI.Point(0, window.innerHeight));
                    this.height = btmPoint.y - pos.y;
                    this.scaleX = this.scaleY;
                }

                let midScreen = this.parent.toLocal(new PIXI.Point(window.innerWidth / 2, window.innerHeight / 2));
                this.x = midScreen.x - this.width / 2;
                this.y = midScreen.y - this.height / 2;
            }
        }
    }

    /**
     * Positions the container at a screen-percentage anchor point when
     * `currentTransform.isAnchored` is `true`.
     */
    public applyAnchor() {
        if (this.currentTransform && this.currentTransform.isAnchored && this.parent) {
            let xPer = this.currentTransform!.anchorPercentage!.x || 0;
            let yPer = this.currentTransform!.anchorPercentage!.y || 0;
            let x = xPer * window.innerWidth;
            let y = yPer * window.innerHeight;
            const globalPoint = new PIXI.Point(x, y);
            const localPoint = this.parent.toLocal(globalPoint);
            this.x = localPoint.x;
            this.y = localPoint.y;
        }
    }

    /** Returns whether this container uses anchor-based positioning. */
    public isAnchored(): boolean {
        return this.currentTransform && this.currentTransform.isAnchored || false;
    }

    public set x(value: number) {
        super.x = value;
        if (this.currentTransform) {
            this.currentTransform.x = value;
        }
    }

    public set width(value: number) {
        super.width = value;
        if (this.currentTransform) {
            this.currentTransform.scaleX = this.scale.x;
        }
    }

    public get width(): number {
        return super.width;
    }

    public get height(): number {
        return super.height;
    }

    public set height(value: number) {
        super.height = value;
        if (this.currentTransform) {
            this.currentTransform.scaleY = this.scale.y;
        }
    }

    public set y(value: number) {
        super.y = value;
        if (this.currentTransform) {
            this.currentTransform.y = value;
        }
    }

    public set rotation(value: number) {
        super.rotation = value;
        if (this.portrait) this.portrait.rotation = value;
        if (this.landscape) this.landscape.rotation = value;
    }

    public get x(): number { return super.x; }
    public get y(): number { return super.y; }
    public get rotation(): number { return super.rotation; }
    public get scaleX(): number { return super.scale.x; }
    public get scaleY(): number { return super.scale.y; }
    public get pivotX(): number { return super.pivot.x; }
    public get pivotY(): number { return super.pivot.y; }

    public set scaleX(value: number) {
        super.scale.x = value;
        if (this.currentTransform) {
            this.currentTransform.scaleX = value;
        }
    }

    public set scaleY(value: number) {
        super.scale.y = value;
        if (this.currentTransform) {
            this.currentTransform.scaleY = value;
        }
    }

    public set pivotX(value: number) {
        super.pivot.x = value;
        if (this.currentTransform) {
            this.currentTransform.pivotX = value;
        }
    }

    public set pivotY(value: number) {
        super.pivot.y = value;
        if (this.currentTransform) {
            this.currentTransform.pivotY = value;
        }
    }

    public setAlpha(value: number) {
        this.alpha = value;
        if (this.portrait) this.portrait.alpha = value;
        if (this.landscape) this.landscape.alpha = value;
    }

    public getAlpha(): number {
        return this.alpha;
    }

    public setVisible(value: boolean) {
        this.visible = value;
        if (this.portrait) this.portrait.visible = value;
        if (this.landscape) this.landscape.visible = value;
    }

    public getVisible(): boolean {
        return this.visible;
    }

    public getTextStyle(): PIXI.TextStyle | null {
        const tf = this.getTextField();
        if (!tf || tf instanceof TextInput) return null;
        if (tf instanceof PIXI.Text) return tf.style as PIXI.TextStyle;
        return null;
    }

    /**
     * Creates a shallow structural clone of this `ZContainer`.
     *
     * PIXI v8: NineSlicePlane → NineSliceSprite, BitmapText constructor updated.
     */
    public clone(): ZContainer {
        const newContainer = new ZContainer();
        newContainer.name = this.name;
        newContainer.position.set(this.position.x, this.position.y);
        newContainer.pivot.set(this.pivot.x, this.pivot.y);
        newContainer.scale.set(this.scale.x, this.scale.y);
        newContainer.rotation = this.rotation;
        newContainer.alpha = this.alpha;
        newContainer.visible = this.visible;

        for (const child of this.children) {
            if (child instanceof PIXI.Text) {
                const c = new PIXI.Text({ text: child.text, style: child.style });
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                newContainer.addChild(c);
            } else if (child instanceof PIXI.BitmapText) {
                // PIXI v8 BitmapText: constructor takes { text, style: { fontFamily, fontSize } }
                const c = new PIXI.BitmapText({
                    text: child.text,
                    style: {
                        fontFamily: (child.style as any).fontFamily ?? (child as any).fontName,
                        fontSize: (child.style as any).fontSize ?? (child as any).fontSize,
                    },
                });
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                newContainer.addChild(c);
            } else if (child instanceof PIXI.NineSliceSprite) {
                // PIXI v8: NineSliceSprite with named params
                const c = new PIXI.NineSliceSprite({
                    texture: child.texture,
                    leftWidth: child.leftWidth,
                    topHeight: child.topHeight,
                    rightWidth: child.rightWidth,
                    bottomHeight: child.bottomHeight,
                });
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                c.width = child.width;
                c.height = child.height;
                newContainer.addChild(c);
            } else if (child instanceof PIXI.Sprite) {
                const c = new PIXI.Sprite(child.texture);
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                c.anchor.set(child.anchor.x, child.anchor.y);
                newContainer.addChild(c);
            } else if ((child as any).clone) {
                newContainer.addChild((child as any).clone());
            }
        }
        return newContainer;
    }

    /**
     * Initialises and starts a particle emitter on this container.
     */
    public loadParticle(emitterConfig: any, texture: PIXI.Texture, name: string): void {
        try {
            (emitterConfig as EmitterConfig).behaviors.find(
                (b: EmitterBehavior) => b.type === "textureSingle"
            )!.config = {
                ...(emitterConfig as EmitterConfig).behaviors.find(
                    (b: EmitterBehavior) => b.type === "textureSingle"
                )!.config,
                texture: texture,
            };

            this.emitter = new Emitter(this as any, emitterConfig);
            this.playParticleAnim();
        } catch (error) {
            console.error("Error creating ParticleController:", error);
            alert(
                "Failed to load particle effect. Please make sure you're using the new Pixi JSON format (with 'behaviors'). " +
                "Legacy configs with 'alpha', 'scale', 'speed', etc. are no longer supported."
            );
        }
    }

    /**
     * Searches direct children for a Spine animation object (Spine 3.8 or 4.0)
     * and returns the first match.
     */
    getSpine(): SpineGameObject | undefined {
        for (let child of this.children) {
            if (child instanceof SpineGameObject) {
                return child;
            }
        }
        return undefined;
    }

    /** Starts (or resumes) the particle emitter. */
    playParticleAnim() {
        if (!this.emitter) {
            console.warn("Emitter not initialized. Call loadParticle first.");
            return;
        }
        this.emitter!.emit = true;
    }

    /** Pauses particle emission. Existing particles continue to age naturally. */
    stopParticleAnim() {
        if (!this.emitter) {
            console.warn("Emitter not initialized. Call loadParticle first.");
            return;
        }
        this.emitter!.emit = false;
    }
}
