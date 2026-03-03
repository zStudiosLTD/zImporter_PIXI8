export var AnchorConsts;
(function (AnchorConsts) {
    AnchorConsts["NONE"] = "none";
    AnchorConsts["TOP_LEFT"] = "topLeft";
    AnchorConsts["TOP_RIGHT"] = "topRight";
    AnchorConsts["BOTTOM_LEFT"] = "btmLeft";
    AnchorConsts["BOTTOM_RIGHT"] = "btmRight";
    AnchorConsts["LEFT"] = "left";
    AnchorConsts["RIGHT"] = "right";
    AnchorConsts["TOP"] = "top";
    AnchorConsts["BOTTOM"] = "btm";
    AnchorConsts["CENTER"] = "center";
})(AnchorConsts || (AnchorConsts = {}));
// PIXI v8 removed TEXT_GRADIENT – replicate the constants locally.
export var TEXT_GRADIENT;
(function (TEXT_GRADIENT) {
    TEXT_GRADIENT[TEXT_GRADIENT["LINEAR_VERTICAL"] = 0] = "LINEAR_VERTICAL";
    TEXT_GRADIENT[TEXT_GRADIENT["LINEAR_HORIZONTAL"] = 1] = "LINEAR_HORIZONTAL";
})(TEXT_GRADIENT || (TEXT_GRADIENT = {}));
export class BitmapTextGradientData {
    colors = [];
    percentages = [];
    /**
     * 0 = LINEAR_VERTICAL (was PIXI.TEXT_GRADIENT.LINEAR_VERTICAL in v7)
     * 1 = LINEAR_HORIZONTAL
     */
    fillGradientType = TEXT_GRADIENT.LINEAR_VERTICAL;
}
//# sourceMappingURL=SceneData.js.map