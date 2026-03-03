import * as PIXI from "pixi.js";
import { NineSliceData, OrientationData } from "./SceneData";

/**
 * PIXI v8: NineSlicePlane was renamed to NineSliceSprite and the constructor
 * now accepts a named-parameter options object.
 *
 * v7: new NineSlicePlane(texture, leftWidth, topHeight, rightWidth, bottomHeight)
 * v8: new NineSliceSprite({ texture, leftWidth, topHeight, rightWidth, bottomHeight })
 */
export class ZNineSlice extends PIXI.NineSliceSprite {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;

    constructor(texture: PIXI.Texture, nineSliceData: NineSliceData, orientation: string) {
        // Preserve the original positional mapping from the v7 code:
        //   arg1 = nineSliceData.left  → leftWidth
        //   arg2 = nineSliceData.right → topHeight  (original v7 ordering kept for parity)
        //   arg3 = nineSliceData.top   → rightWidth
        //   arg4 = nineSliceData.bottom→ bottomHeight
        super({
            texture,
            leftWidth: nineSliceData.left,
            topHeight: nineSliceData.right,
            rightWidth: nineSliceData.top,
            bottomHeight: nineSliceData.bottom,
        });
        this.portrait = nineSliceData.portrait;
        this.landscape = nineSliceData.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    /**
     * Switches the active orientation data and re-applies the nine-slice dimensions.
     * @param width - The new viewport width (passed by the scene; not used directly).
     * @param height - The new viewport height (passed by the scene; not used directly).
     * @param orientation - `"portrait"` or `"landscape"`.
     */
    public resize(width: number, height: number, orientation: "portrait" | "landscape") {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    /**
     * Reads `currentTransform.width` and `currentTransform.height` and applies
     * them to the nine-slice sprite.
     */
    private applyTransform() {
        this.width = this.currentTransform.width;
        this.height = this.currentTransform.height;
    }
}
