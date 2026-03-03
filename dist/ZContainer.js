import * as PIXI from 'pixi.js';
import { Emitter } from "@pixi/particle-emitter";
import { ZNineSlice } from './ZNineSlice';
import TextInput from './text-input';
import { Spine as SpineGameObject } from "@esotericsoftware/spine-pixi-v8";
/**
 * A custom container class extending `PIXI.Container` that supports orientation-based
 * transforms, anchoring, and instance data management for responsive layouts.
 *
 * PIXI v8 notes:
 *  - NineSlicePlane → NineSliceSprite
 *  - eventMode is now a first-class typed property on Container
 */
export class ZContainer extends PIXI.Container {
    portrait;
    landscape;
    currentTransform;
    resizeable = true;
    name = "";
    _fitToScreen = false;
    emitter;
    originalTextWidth;
    originalTextHeight;
    originalFontSize;
    fixedBoxSize;
    _props;
    /**
     * Performs a breadth-first search and returns the first descendant `ZContainer`
     * with the given name.
     */
    get(childName) {
        const queue = [];
        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                if (child instanceof ZContainer) {
                    queue.push(child);
                }
            }
        }
        while (queue.length > 0) {
            const current = queue.shift();
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
    getAll(childName) {
        const queue = [];
        const result = [];
        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                if (child instanceof ZContainer) {
                    queue.push(child);
                }
            }
        }
        while (queue.length > 0) {
            const current = queue.shift();
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
        return result;
    }
    /**
     * Called once all children of the container are loaded.
     * Captures the original text-field dimensions and font size.
     */
    init() {
        let tf = this.getTextField();
        if (tf) {
            if (tf instanceof TextInput || tf instanceof PIXI.BitmapText || !tf.style) {
                return;
            }
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
    /** Returns `"ZContainer"`. */
    getType() {
        return "ZContainer";
    }
    /**
     * Enables or disables fixed-box-size mode. When enabled, `setText` will
     * shrink the font size to keep the text within the original measured bounds.
     */
    setFixedBoxSize(value) {
        this.fixedBoxSize = value;
    }
    /**
     * Performs a breadth-first search and returns all descendants that report
     * the given type string via their `getType()` method.
     */
    getAllOfType(type) {
        const queue = [];
        const result = [];
        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                if (child.getType) {
                    queue.push(child);
                }
            }
        }
        while (queue.length > 0) {
            const current = queue.shift();
            let _t = current.getType();
            if (_t === type) {
                result.push(current);
            }
            if (current.children && current.children.length > 0) {
                for (let child of current.children) {
                    if (child.getType) {
                        queue.push(child);
                    }
                }
            }
        }
        return result;
    }
    /**
     * Sets the text content of the first text-field child. If fixed-box-size
     * mode is on, the font size will be reduced until the text fits.
     */
    setText(text) {
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
    setTextStyle(data) {
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
    getProps() {
        return this._props;
    }
    /**
     * Shrinks the font size of `textChild` until both its width and height fit
     * within `originalTextWidth` / `originalTextHeight` (only when `fixedBoxSize` is true).
     */
    resizeText(textChild) {
        if (this.fixedBoxSize) {
            let style = textChild.style;
            let maxWidth = this.originalTextWidth;
            let maxHeight = this.originalTextHeight;
            if ((maxWidth !== undefined && maxWidth > 0) || (maxHeight !== undefined && maxHeight > 0)) {
                while ((maxWidth !== undefined && textChild.width > maxWidth) ||
                    (maxHeight !== undefined && textChild.height > maxHeight)) {
                    style = new PIXI.TextStyle({
                        ...style,
                        fontSize: style.fontSize - 1,
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
    getTextField() {
        let textChild = this.getChildByName("label");
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
    setInstanceData(data, orientation) {
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
    set fitToScreen(value) {
        this._fitToScreen = value;
        if (value) {
            this.executeFitToScreen();
        }
        else {
            this.applyTransform();
        }
    }
    get fitToScreen() {
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
        if (!this.currentTransform)
            return;
        if (!this.resizeable)
            return;
        if (this.parent) {
            let currentFrame = this.parent.currentFrame;
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
        this.applyAnchor();
    }
    /**
     * Switches the active orientation data and re-applies the transform.
     */
    resize(width, height, orientation) {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }
    /**
     * Stretches this container (or its first `ZNineSlice` child) to cover the
     * full browser viewport.
     */
    executeFitToScreen() {
        let children = this.children;
        if (children.length === 0)
            return;
        if (this.parent) {
            this.pivotX = 0;
            this.pivotY = 0;
            let pos = this.parent.toLocal(new PIXI.Point(0, 0));
            this.x = pos.x;
            this.y = pos.y;
            if (children[0] instanceof ZNineSlice) {
                let nineSlice = children[0];
                let btmPoint = this.parent.toLocal(new PIXI.Point(window.innerWidth, window.innerHeight));
                nineSlice.width = btmPoint.x - pos.x;
                nineSlice.height = btmPoint.y - pos.y;
            }
            else {
                if (window.innerWidth > window.innerHeight) {
                    let rightPoint = this.parent.toLocal(new PIXI.Point(window.innerWidth, 0));
                    this.width = rightPoint.x - pos.x;
                    this.scaleY = this.scaleX;
                }
                else {
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
    applyAnchor() {
        if (this.currentTransform && this.currentTransform.isAnchored && this.parent) {
            let xPer = this.currentTransform.anchorPercentage.x || 0;
            let yPer = this.currentTransform.anchorPercentage.y || 0;
            let x = xPer * window.innerWidth;
            let y = yPer * window.innerHeight;
            const globalPoint = new PIXI.Point(x, y);
            const localPoint = this.parent.toLocal(globalPoint);
            this.x = localPoint.x;
            this.y = localPoint.y;
        }
    }
    /** Returns whether this container uses anchor-based positioning. */
    isAnchored() {
        return this.currentTransform && this.currentTransform.isAnchored || false;
    }
    set x(value) {
        super.x = value;
        if (this.currentTransform) {
            this.currentTransform.x = value;
        }
    }
    set width(value) {
        super.width = value;
        if (this.currentTransform) {
            this.currentTransform.scaleX = this.scale.x;
        }
    }
    get width() {
        return super.width;
    }
    get height() {
        return super.height;
    }
    set height(value) {
        super.height = value;
        if (this.currentTransform) {
            this.currentTransform.scaleY = this.scale.y;
        }
    }
    set y(value) {
        super.y = value;
        if (this.currentTransform) {
            this.currentTransform.y = value;
        }
    }
    set rotation(value) {
        super.rotation = value;
        if (this.portrait)
            this.portrait.rotation = value;
        if (this.landscape)
            this.landscape.rotation = value;
    }
    get x() { return super.x; }
    get y() { return super.y; }
    get rotation() { return super.rotation; }
    get scaleX() { return super.scale.x; }
    get scaleY() { return super.scale.y; }
    get pivotX() { return super.pivot.x; }
    get pivotY() { return super.pivot.y; }
    set scaleX(value) {
        super.scale.x = value;
        if (this.currentTransform) {
            this.currentTransform.scaleX = value;
        }
    }
    set scaleY(value) {
        super.scale.y = value;
        if (this.currentTransform) {
            this.currentTransform.scaleY = value;
        }
    }
    set pivotX(value) {
        super.pivot.x = value;
        if (this.currentTransform) {
            this.currentTransform.pivotX = value;
        }
    }
    set pivotY(value) {
        super.pivot.y = value;
        if (this.currentTransform) {
            this.currentTransform.pivotY = value;
        }
    }
    setAlpha(value) {
        this.alpha = value;
        if (this.portrait)
            this.portrait.alpha = value;
        if (this.landscape)
            this.landscape.alpha = value;
    }
    getAlpha() {
        return this.alpha;
    }
    setVisible(value) {
        this.visible = value;
        if (this.portrait)
            this.portrait.visible = value;
        if (this.landscape)
            this.landscape.visible = value;
    }
    getVisible() {
        return this.visible;
    }
    getTextStyle() {
        const tf = this.getTextField();
        if (!tf || tf instanceof TextInput)
            return null;
        if (tf instanceof PIXI.Text)
            return tf.style;
        return null;
    }
    /**
     * Creates a shallow structural clone of this `ZContainer`.
     *
     * PIXI v8: NineSlicePlane → NineSliceSprite, BitmapText constructor updated.
     */
    clone() {
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
            }
            else if (child instanceof PIXI.BitmapText) {
                // PIXI v8 BitmapText: constructor takes { text, style: { fontFamily, fontSize } }
                const c = new PIXI.BitmapText({
                    text: child.text,
                    style: {
                        fontFamily: child.style.fontFamily ?? child.fontName,
                        fontSize: child.style.fontSize ?? child.fontSize,
                    },
                });
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                newContainer.addChild(c);
            }
            else if (child instanceof PIXI.NineSliceSprite) {
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
            }
            else if (child instanceof PIXI.Sprite) {
                const c = new PIXI.Sprite(child.texture);
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                c.anchor.set(child.anchor.x, child.anchor.y);
                newContainer.addChild(c);
            }
            else if (child.clone) {
                newContainer.addChild(child.clone());
            }
        }
        return newContainer;
    }
    /**
     * Initialises and starts a particle emitter on this container.
     */
    loadParticle(emitterConfig, texture, name) {
        try {
            emitterConfig.behaviors.find((b) => b.type === "textureSingle").config = {
                ...emitterConfig.behaviors.find((b) => b.type === "textureSingle").config,
                texture: texture,
            };
            this.emitter = new Emitter(this, emitterConfig);
            this.playParticleAnim();
        }
        catch (error) {
            console.error("Error creating ParticleController:", error);
            alert("Failed to load particle effect. Please make sure you're using the new Pixi JSON format (with 'behaviors'). " +
                "Legacy configs with 'alpha', 'scale', 'speed', etc. are no longer supported.");
        }
    }
    /**
     * Searches direct children for a Spine animation object (Spine 3.8 or 4.0)
     * and returns the first match.
     */
    getSpine() {
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
        this.emitter.emit = true;
    }
    /** Pauses particle emission. Existing particles continue to age naturally. */
    stopParticleAnim() {
        if (!this.emitter) {
            console.warn("Emitter not initialized. Call loadParticle first.");
            return;
        }
        this.emitter.emit = false;
    }
}
//# sourceMappingURL=ZContainer.js.map