import * as PIXI from "pixi.js";
/**
 * PIXI v8: NineSlicePlane was renamed to NineSliceSprite and the constructor
 * now accepts a named-parameter options object.
 *
 * v7: new NineSlicePlane(texture, leftWidth, topHeight, rightWidth, bottomHeight)
 * v8: new NineSliceSprite({ texture, leftWidth, topHeight, rightWidth, bottomHeight })
 */
export class ZNineSlice extends PIXI.NineSliceSprite {
    portrait;
    landscape;
    currentTransform;
    constructor(texture, nineSliceData, orientation) {
        super({
            texture,
            leftWidth: nineSliceData.left,
            topHeight: nineSliceData.top,
            rightWidth: nineSliceData.right,
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
    resize(width, height, orientation) {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }
    /**
     * Reads `currentTransform.width` and `currentTransform.height` and applies
     * them to the nine-slice sprite.
     */
    applyTransform() {
        this.width = this.currentTransform.width;
        this.height = this.currentTransform.height;
    }
}
//# sourceMappingURL=ZNineSlice.js.map