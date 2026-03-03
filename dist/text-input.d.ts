/**
 * text-input.ts — PIXI v8 port
 *
 * Key changes from v7:
 *  - `DisplayObject`   → `Container`   (DisplayObject removed from pixi.js v8 exports)
 *  - `IPointData`      → `PointData`   (renamed in v8)
 *  - `worldAlpha`      → `groupAlpha`  (worldAlpha removed in v8)
 *  - `worldVisible`    → `groupVisible`(worldVisible removed in v8)
 *  - `worldTransform`  → still a getter on Container in v8
 *  - `renderer.view`   → `renderer.canvas`
 *  - `Graphics` draw API: beginFill/drawRect/endFill → rect/roundRect + .fill()/.stroke()
 */
import { Container } from 'pixi.js';
import { InputBoxStyle, TextInputObj } from './SceneData';
type BoxState = 'DEFAULT' | 'FOCUSED' | 'DISABLED';
export default class TextInput extends Container {
    private _input_style;
    private _box_generator;
    styles: TextInputObj;
    private _dom_input;
    private _dom_added;
    private _dom_visible;
    private _multiline;
    private _box_cache;
    private _previous;
    private _placeholder;
    private _placeholderColor;
    private _selection;
    private _restrict_value;
    private _restrict_regex?;
    private _substituted;
    private _disabled;
    private _max_length?;
    private _surrogate?;
    private _surrogate_mask?;
    private _surrogate_hitbox?;
    private state?;
    private _box?;
    private force;
    private _last_renderer;
    private _canvas_bounds?;
    private _resolution?;
    private _font_metrics;
    constructor(styles: TextInputObj);
    setState(state: BoxState): void;
    updateBox(style: InputBoxStyle, state: BoxState): void;
    get substituteText(): boolean;
    set substituteText(substitute: boolean);
    get placeholder(): string;
    set placeholder(text: string);
    get disabled(): boolean;
    set disabled(disabled: boolean);
    get maxLength(): number | undefined;
    set maxLength(length: number | undefined);
    get restrict(): RegExp | string | undefined;
    set restrict(regex: RegExp | string | undefined);
    get text(): string;
    set text(text: string);
    get htmlInput(): HTMLInputElement | HTMLTextAreaElement;
    focus(): void;
    blur(): void;
    select(): void;
    setInputStyle(key: string, value: string): void;
    destroy(options?: any): void;
    private _createDOMInput;
    private _addListeners;
    private _onInputKeyDown;
    private _onInputInput;
    private _onInputKeyUp;
    private _onFocused;
    private _onBlurred;
    private _onAdded;
    private _onRemoved;
    private _setState;
    getState(): BoxState | undefined;
    private _renderInternal;
    private _update;
    private _updateBox;
    private _updateSubstitution;
    private _updateDOMInput;
    private _applyRestriction;
    private _needsUpdate;
    private _needsNewBoxCache;
    private _createSurrogate;
    private _updateSurrogate;
    private _updateSurrogateHitbox;
    private _updateSurrogateMask;
    private _destroySurrogate;
    private _onSurrogateFocus;
    private _ensureFocus;
    private _deriveSurrogateStyle;
    private _deriveSurrogatePadding;
    private _deriveSurrogateText;
    private _updateFontMetrics;
    private _buildBoxCache;
    private _destroyBoxCache;
    private _hasFocus;
    private _setDOMInputVisible;
    private _getCanvasBounds;
    private _getDOMInputBounds;
    private _getDOMRelativeWorldTransform;
    private _pixiMatrixToCSS;
    private _comparePixiMatrices;
    private _compareClientRects;
}
export {};
//# sourceMappingURL=text-input.d.ts.map