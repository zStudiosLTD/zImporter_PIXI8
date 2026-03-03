import * as PIXI from "pixi.js";
import { NineSliceData, OrientationData } from "./SceneData";
/**
 * PIXI v8: NineSlicePlane was renamed to NineSliceSprite and the constructor
 * now accepts a named-parameter options object.
 *
 * v7: new NineSlicePlane(texture, leftWidth, topHeight, rightWidth, bottomHeight)
 * v8: new NineSliceSprite({ texture, leftWidth, topHeight, rightWidth, bottomHeight })
 */
export declare class ZNineSlice extends PIXI.NineSliceSprite {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    constructor(texture: PIXI.Texture, nineSliceData: NineSliceData, orientation: string);
    /**
     * Switches the active orientation data and re-applies the nine-slice dimensions.
     * @param width - The new viewport width (passed by the scene; not used directly).
     * @param height - The new viewport height (passed by the scene; not used directly).
     * @param orientation - `"portrait"` or `"landscape"`.
     */
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    /**
     * Reads `currentTransform.width` and `currentTransform.height` and applies
     * them to the nine-slice sprite.
     */
    private applyTransform;
}
//# sourceMappingURL=ZNineSlice.d.ts.map