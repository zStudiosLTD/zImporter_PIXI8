import * as PIXI from 'pixi.js';
import { InstanceData } from './SceneData';
import { OrientationData } from './SceneData';
import { Emitter } from "@pixi/particle-emitter";
import TextInput from './text-input';
import { Spine as SpineGameObject } from "@esotericsoftware/spine-pixi-v8";
export interface AnchorData {
    anchorType: string;
    anchorPercentage: {
        x: number;
        y: number;
    };
}
/**
 * A custom container class extending `PIXI.Container` that supports orientation-based
 * transforms, anchoring, and instance data management for responsive layouts.
 *
 * PIXI v8 notes:
 *  - NineSlicePlane → NineSliceSprite
 *  - eventMode is now a first-class typed property on Container
 */
export declare class ZContainer extends PIXI.Container {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    resizeable: boolean;
    name: string;
    _fitToScreen: boolean;
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
    get(childName: string): ZContainer | null;
    /**
     * Performs a breadth-first search and returns all descendant `ZContainer`
     * instances with the given name.
     */
    getAll(childName: string): ZContainer[];
    /**
     * Called once all children of the container are loaded.
     * Captures the original text-field dimensions and font size.
     */
    init(): void;
    /** Returns `"ZContainer"`. */
    getType(): string;
    /**
     * Enables or disables fixed-box-size mode. When enabled, `setText` will
     * shrink the font size to keep the text within the original measured bounds.
     */
    setFixedBoxSize(value: boolean): void;
    /**
     * Performs a breadth-first search and returns all descendants that report
     * the given type string via their `getType()` method.
     */
    getAllOfType(type: string): ZContainer[];
    /**
     * Sets the text content of the first text-field child. If fixed-box-size
     * mode is on, the font size will be reduced until the text fits.
     */
    setText(text: string): void;
    /**
     * Merges additional style properties onto the text-field's existing style
     * and re-runs the resize logic to keep the text within bounds.
     */
    setTextStyle(data: Partial<PIXI.TextStyle>): void;
    /** Returns the raw instance-data props object stored via `setInstanceData`. */
    getProps(): any;
    /**
     * Shrinks the font size of `textChild` until both its width and height fit
     * within `originalTextWidth` / `originalTextHeight` (only when `fixedBoxSize` is true).
     */
    private resizeText;
    /**
     * Finds and returns the first text-field child. Prefers a child named
     * `"label"`, then the first `PIXI.Text` or `TextInput` among direct children.
     */
    getTextField(): PIXI.Text | TextInput | null;
    /**
     * Applies scene-editor instance data to this container.
     */
    setInstanceData(data: InstanceData, orientation: string): void;
    /**
     * When set to `true`, stretches this container to fill the entire screen.
     */
    set fitToScreen(value: boolean);
    get fitToScreen(): boolean;
    /**
     * Reads `currentTransform` (or delegates to `executeFitToScreen`) and
     * writes position, scale, rotation, pivot, alpha, and visibility onto this container.
     */
    applyTransform(): void;
    /**
     * Switches the active orientation data and re-applies the transform.
     */
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    /**
     * Stretches this container (or its first `ZNineSlice` child) to cover the
     * full browser viewport.
     */
    executeFitToScreen(): void;
    /**
     * Positions the container at a screen-percentage anchor point when
     * `currentTransform.isAnchored` is `true`.
     */
    applyAnchor(): void;
    /** Returns whether this container uses anchor-based positioning. */
    isAnchored(): boolean;
    set x(value: number);
    set width(value: number);
    get width(): number;
    get height(): number;
    set height(value: number);
    set y(value: number);
    set rotation(value: number);
    get x(): number;
    get y(): number;
    get rotation(): number;
    get scaleX(): number;
    get scaleY(): number;
    get pivotX(): number;
    get pivotY(): number;
    set scaleX(value: number);
    set scaleY(value: number);
    set pivotX(value: number);
    set pivotY(value: number);
    setAlpha(value: number): void;
    getAlpha(): number;
    setVisible(value: boolean): void;
    getVisible(): boolean;
    getTextStyle(): PIXI.TextStyle | null;
    /**
     * Creates a shallow structural clone of this `ZContainer`.
     *
     * PIXI v8: NineSlicePlane → NineSliceSprite, BitmapText constructor updated.
     */
    clone(): ZContainer;
    /**
     * Initialises and starts a particle emitter on this container.
     */
    loadParticle(emitterConfig: any, texture: PIXI.Texture, name: string): void;
    /**
     * Searches direct children for a Spine animation object (Spine 3.8 or 4.0)
     * and returns the first match.
     */
    getSpine(): SpineGameObject | undefined;
    /** Starts (or resumes) the particle emitter. */
    playParticleAnim(): void;
    /** Pauses particle emission. Existing particles continue to age naturally. */
    stopParticleAnim(): void;
    destroy(options?: Parameters<PIXI.Container['destroy']>[0]): void;
}
//# sourceMappingURL=ZContainer.d.ts.map