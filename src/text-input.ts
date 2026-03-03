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
import {
    Container,
    Graphics,
    Text,
    TextStyle,
    CanvasTextMetrics,
    PointData,
    Matrix,
} from 'pixi.js';
import { InputBoxStyle, InputParams, TextInputObj } from './SceneData';

type BoxState = 'DEFAULT' | 'FOCUSED' | 'DISABLED';

type BoxGenerator = (width: number, height: number, state: BoxState) => Container;

interface PreviousState {
    state?: BoxState;
    canvas_bounds?: ClientRect | DOMRect;
    world_transform?: Matrix;
    world_alpha?: number;
    world_visible?: boolean;
    input_bounds?: { width: number; height: number };
}

export default class TextInput extends Container {
    // Styles & generators
    private _input_style: InputParams;
    private _box_generator: BoxGenerator | null;
    public styles: TextInputObj;

    // DOM
    private _dom_input!: HTMLInputElement | HTMLTextAreaElement;
    private _dom_added: boolean = false;
    private _dom_visible: boolean = true;

    // State
    private _multiline: boolean;
    private _box_cache: Record<string, Container | null>;
    private _previous: PreviousState;
    private _placeholder: string = '';
    private _placeholderColor: number = 0xa9a9a9;
    private _selection: [number | null, number | null] = [0, 0];
    private _restrict_value: string = '';
    private _restrict_regex?: RegExp;

    private _substituted: boolean = false;
    private _disabled: boolean = false;
    private _max_length?: number;

    // Surrogate
    private _surrogate?: Text | null;
    private _surrogate_mask?: Graphics | null;
    private _surrogate_hitbox?: Graphics | null;

    // Internal
    private state?: BoxState;
    private _box?: Container | null;
    private force: boolean = false;
    private _last_renderer: any;
    private _canvas_bounds?: { top: number; left: number; width: number; height: number };
    private _resolution?: number;
    private _font_metrics: unknown;

    constructor(styles: TextInputObj) {
        super();

        this._input_style = Object.assign(
            {
                position: 'absolute',
                background: 'none',
                border: 'none',
                outline: 'none',
                transformOrigin: '0 0',
                lineHeight: '1',
            },
            styles.input
        );

        if (styles.box) {
            this._box_generator =
                typeof styles.box === 'function'
                    ? (styles.box as BoxGenerator)
                    : DefaultBoxGenerator(styles.box as any);
        } else {
            this._box_generator = null;
        }

        if (this._input_style.hasOwnProperty('multiline')) {
            this._multiline = !!(this._input_style as any).multiline;
            delete (this._input_style as any).multiline;
        } else {
            this._multiline = false;
        }

        this._box_cache = {};
        this._previous = {};
        this._dom_added = false;
        this._dom_visible = true;
        this._placeholder = '';
        this._placeholderColor = 0xa9a9a9;
        this._selection = [0, 0];
        this._restrict_value = '';
        this._createDOMInput();
        this.substituteText = true;
        this._setState('DEFAULT');
        this._addListeners();
        this.styles = styles;
        // PIXI v8: use onRender hook instead of overriding render()
        this.onRender = (renderer: any) => this._renderInternal(renderer);
    }

    setState(state: BoxState) {
        this._setState(state);
    }

    updateBox(style: InputBoxStyle, state: BoxState) {
        if (!this.styles.box || typeof this.styles.box === 'function') return;
        (this.styles.box as any)[state.toLowerCase()] = style;
        const input_bounds = this._getDOMInputBounds();

        if (!this._box_generator) return;
        this._box_cache[state] = this._box_generator(input_bounds.width, input_bounds.height, state);
        this.force = true;
    }

    // GETTERS & SETTERS

    get substituteText() {
        return this._substituted;
    }

    set substituteText(substitute: boolean) {
        if (this._substituted === substitute) return;

        this._substituted = substitute;

        if (substitute) {
            this._createSurrogate();
            this._dom_visible = false;
        } else {
            this._destroySurrogate();
            this._dom_visible = true;
        }
        this.placeholder = this._placeholder;
        this._update();
    }

    get placeholder() {
        return this._placeholder;
    }

    set placeholder(text: string) {
        this._placeholder = text;
        if (this._substituted) {
            this._updateSurrogate();
            this._dom_input.placeholder = '';
        } else {
            this._dom_input.placeholder = text;
        }
    }

    get disabled() {
        return this._disabled;
    }

    set disabled(disabled: boolean) {
        this._disabled = disabled;
        this._dom_input.disabled = disabled;
        this._setState(disabled ? 'DISABLED' : 'DEFAULT');
    }

    get maxLength() {
        return this._max_length;
    }

    set maxLength(length: number | undefined) {
        this._max_length = length;
        if (length !== undefined) {
            this._dom_input.setAttribute('maxlength', String(length));
        } else {
            this._dom_input.removeAttribute('maxlength');
        }
    }

    get restrict() {
        return this._restrict_regex;
    }

    set restrict(regex: RegExp | string | undefined) {
        if (regex instanceof RegExp) {
            let str = regex.toString().slice(1, -1);
            if (str.charAt(0) !== '^') str = '^' + str;
            if (str.charAt(str.length - 1) !== '$') str = str + '$';
            this._restrict_regex = new RegExp(str);
        } else if (typeof regex === 'string') {
            this._restrict_regex = new RegExp('^[' + regex + ']*$');
        } else {
            this._restrict_regex = undefined;
        }
    }

    get text() {
        return this._dom_input.value;
    }

    set text(text: string) {
        this._dom_input.value = text;
        if (this._substituted) this._updateSurrogate();
    }

    get htmlInput() {
        return this._dom_input;
    }

    focus() {
        if (this._substituted && !this._dom_visible) this._setDOMInputVisible(true);
        this._dom_input.focus();
    }

    blur() {
        this._dom_input.blur();
    }

    select() {
        this.focus();
        this._dom_input.select();
    }

    setInputStyle(key: string, value: string) {
        (this._input_style as any)[key] = value;
        (this._dom_input.style as any)[key] = value;

        if (
            this._substituted &&
            (key === 'fontFamily' ||
                key === 'fontSize' ||
                key === 'fontWeight' ||
                key === 'color')
        ) {
            this._updateFontMetrics();
        }

        if (this._last_renderer) this._update();
    }

    destroy(options?: any) {
        this._destroyBoxCache();
        super.destroy(options);
    }

    // SETUP

    private _createDOMInput() {
        if (this._multiline) {
            const ta = document.createElement('textarea');
            ta.style.resize = 'none';
            this._dom_input = ta;
        } else {
            const inp = document.createElement('input');
            inp.type = 'text';
            this._dom_input = inp;
        }

        for (const key in this._input_style) {
            (this._dom_input.style as any)[key] = (this._input_style as any)[key];
        }
    }

    private _addListeners() {
        this.on('added', this._onAdded.bind(this) as any);
        this.on('removed', this._onRemoved.bind(this) as any);
        this._dom_input.addEventListener('keydown', this._onInputKeyDown.bind(this) as any);
        this._dom_input.addEventListener('input', this._onInputInput.bind(this) as any);
        this._dom_input.addEventListener('keyup', this._onInputKeyUp.bind(this) as any);
        this._dom_input.addEventListener('focus', this._onFocused.bind(this) as any);
        this._dom_input.addEventListener('blur', this._onBlurred.bind(this) as any);
    }

    private _onInputKeyDown(e: KeyboardEvent) {
        this._selection = [
            this._dom_input.selectionStart,
            this._dom_input.selectionEnd,
        ] as [number | null, number | null];

        this.emit('keydown', (e as any).keyCode);
    }

    private _onInputInput(_e: Event) {
        if (this._restrict_regex) this._applyRestriction();

        if (this._substituted) this._updateSubstitution();

        this.emit('input', this.text);
    }

    private _onInputKeyUp(e: KeyboardEvent) {
        this.emit('keyup', (e as any).keyCode);
    }

    private _onFocused() {
        this._setState('FOCUSED');
        this.emit('focus');
    }

    private _onBlurred() {
        this._setState('DEFAULT');
        this.emit('blur');
    }

    private _onAdded() {
        document.body.appendChild(this._dom_input);
        this._dom_input.style.display = 'none';
        this._dom_added = true;
    }

    private _onRemoved() {
        document.body.removeChild(this._dom_input);
        this._dom_added = false;
    }

    private _setState(state: BoxState) {
        this.state = state;
        this._updateBox();
        if (this._substituted) this._updateSubstitution();
    }

    getState() {
        return this.state;
    }

    // RENDER & UPDATE

    private _renderInternal(renderer: any) {
        this._resolution = renderer.resolution;
        this._last_renderer = renderer;
        this._canvas_bounds = this._getCanvasBounds();
        if (this._needsUpdate() || this.force) this._update();
    }

    private _update() {
        this._updateDOMInput();
        if (this._substituted) this._updateSurrogate();
        this._updateBox();
    }

    private _updateBox() {
        if (!this._box_generator) return;

        if (this._needsNewBoxCache() || this.force) this._buildBoxCache();

        if (!this.force && this.state === this._previous.state && this._box === this._box_cache[this.state!]) return;

        if (this._box) this.removeChild(this._box);

        this._box = this._box_cache[this.state!];
        if (this._box) this.addChildAt(this._box, 0);
        this._previous.state = this.state;
        this.force = false;
    }

    private _updateSubstitution() {
        if (this.state === 'FOCUSED') {
            this._dom_visible = true;
            if (this._surrogate) this._surrogate.visible = this.text.length === 0;
        } else {
            this._dom_visible = false;
            if (this._surrogate) this._surrogate.visible = true;
        }
        this._updateDOMInput();
        this._updateSurrogate();
    }

    private _updateDOMInput() {
        if (!this._canvas_bounds) return;

        this._dom_input.style.top = (this._canvas_bounds.top || 0) + 'px';
        this._dom_input.style.left = (this._canvas_bounds.left || 0) + 'px';
        this._dom_input.style.transform = this._pixiMatrixToCSS(this._getDOMRelativeWorldTransform());

        // PIXI v8: worldAlpha → groupAlpha (computed by renderer during traversal)
        const worldAlpha: number = (this as any).groupAlpha ?? this.alpha;
        const worldVisible: boolean = (this as any).groupVisible ?? this.visible;

        this._dom_input.style.opacity = String(worldAlpha);
        this._setDOMInputVisible(worldVisible && this._dom_visible);

        this._previous.canvas_bounds = this._canvas_bounds as any;
        this._previous.world_transform = this.worldTransform.clone();
        this._previous.world_alpha = worldAlpha;
        this._previous.world_visible = worldVisible;
    }

    private _applyRestriction() {
        if (!this._restrict_regex) return;
        if (this._restrict_regex.test(this.text)) {
            this._restrict_value = this.text;
        } else {
            this.text = this._restrict_value;
            this._dom_input.setSelectionRange(this._selection[0] ?? 0, this._selection[1] ?? 0);
        }
    }

    // STATE COMPARISONS

    private _needsUpdate() {
        const worldAlpha: number = (this as any).groupAlpha ?? this.alpha;
        const worldVisible: boolean = (this as any).groupVisible ?? this.visible;
        return (
            !this._comparePixiMatrices(this.worldTransform, this._previous.world_transform as any) ||
            !this._compareClientRects(this._canvas_bounds as any, this._previous.canvas_bounds as any) ||
            worldAlpha != this._previous.world_alpha ||
            worldVisible != this._previous.world_visible
        );
    }

    private _needsNewBoxCache() {
        const input_bounds = this._getDOMInputBounds();
        return (
            !this._previous.input_bounds ||
            input_bounds.width != this._previous.input_bounds.width ||
            input_bounds.height != this._previous.input_bounds.height
        );
    }

    // INPUT SUBSTITUTION

    private _createSurrogate() {
        this._surrogate_hitbox = new Graphics();
        this._surrogate_hitbox.alpha = 0;
        this._surrogate_hitbox.interactive = true;
        this._surrogate_hitbox.cursor = 'text';
        this._surrogate_hitbox.on('pointerdown', this._onSurrogateFocus.bind(this));
        this.addChild(this._surrogate_hitbox);

        this._surrogate_mask = new Graphics();
        this.addChild(this._surrogate_mask);

        this._surrogate = new Text({ text: '', style: {} });
        this._surrogate.resolution = 2;
        this.addChild(this._surrogate);

        if (this._surrogate) this._surrogate.mask = this._surrogate_mask as any;

        this._updateFontMetrics();
        this._updateSurrogate();
    }

    private _updateSurrogate() {
        const padding = this._deriveSurrogatePadding();
        const input_bounds = this._getDOMInputBounds();

        if (!this._surrogate) return;

        this._surrogate.style = this._deriveSurrogateStyle();
        (this._surrogate.style as any).padding = Math.max(...padding);
        this._surrogate.y = this._multiline
            ? padding[0]
            : (input_bounds.height - this._surrogate.height) / 2;
        this._surrogate.x = padding[3];
        this._surrogate.text = this._deriveSurrogateText();

        switch ((this._surrogate.style as any).align) {
            case 'left':
                this._surrogate.x = padding[3];
                break;
            case 'center':
                this._surrogate.x = input_bounds.width * 0.5 - this._surrogate.width * 0.5;
                break;
            case 'right':
                this._surrogate.x = input_bounds.width - padding[1] - this._surrogate.width;
                break;
        }

        this._updateSurrogateHitbox(input_bounds);
        this._updateSurrogateMask(input_bounds, padding);
    }

    private _updateSurrogateHitbox(bounds: { width: number; height: number }) {
        if (!this._surrogate_hitbox) return;
        // PIXI v8 Graphics API: rect().fill() replaces beginFill/drawRect/endFill
        this._surrogate_hitbox.clear();
        this._surrogate_hitbox.rect(0, 0, bounds.width, bounds.height).fill(0x000000);
        this._surrogate_hitbox.interactive = !this._disabled;
    }

    private _updateSurrogateMask(bounds: { width: number; height: number }, padding: number[]) {
        if (!this._surrogate_mask) return;
        // PIXI v8 Graphics API
        this._surrogate_mask.clear();
        this._surrogate_mask
            .rect(padding[3], 0, bounds.width - padding[3] - padding[1], bounds.height)
            .fill(0x000000);
    }

    private _destroySurrogate() {
        if (!this._surrogate) return;

        if (this._surrogate) this.removeChild(this._surrogate);
        if (this._surrogate_mask) this.removeChild(this._surrogate_mask);
        if (this._surrogate_hitbox) this.removeChild(this._surrogate_hitbox);

        this._surrogate?.destroy();
        this._surrogate_hitbox?.destroy();

        this._surrogate = null;
        this._surrogate_hitbox = null;
    }

    private _onSurrogateFocus() {
        this._setDOMInputVisible(true);
        setTimeout(this._ensureFocus.bind(this), 10);
    }

    private _ensureFocus() {
        if (!this._hasFocus()) this.focus();
    }

    private _deriveSurrogateStyle(): TextStyle {
        const style = new TextStyle();

        for (const key in this._input_style) {
            switch (key) {
                case 'color':
                    (style as any).fill = (this._input_style as any).color;
                    break;
                case 'fontFamily':
                case 'fontSize':
                case 'fontWeight':
                case 'fontVariant':
                case 'fontStyle':
                    (style as any)[key] = (this._input_style as any)[key];
                    break;
                case 'letterSpacing':
                    style.letterSpacing = parseFloat((this._input_style as any).letterSpacing);
                    break;
                case 'textAlign':
                    (style as any).align = (this._input_style as any).textAlign;
                    break;
            }
        }

        if (this._multiline) {
            style.lineHeight = parseFloat((style as any).fontSize || '0');
            style.wordWrap = true;
            style.wordWrapWidth = this._getDOMInputBounds().width;
        }

        if (this._dom_input.value.length === 0) {
            (style as any).fill = this._placeholderColor;
        }

        return style;
    }

    private _deriveSurrogatePadding(): number[] {
        const indent = (this._input_style.textIndent
            ? parseFloat((this._input_style as any).textIndent)
            : 0) as number;

        if ((this._input_style as any).padding && (this._input_style as any).padding.length > 0) {
            const components = (this._input_style as any).padding.trim().split(' ');

            if (components.length == 1) {
                const padding = parseFloat(components[0]);
                return [padding, padding, padding, padding + indent];
            } else if (components.length == 2) {
                const paddingV = parseFloat(components[0]);
                const paddingH = parseFloat(components[1]);
                return [paddingV, paddingH, paddingV, paddingH + indent];
            } else if (components.length == 4) {
                const padding: [number, number, number, number] = components.map(
                    (c: string): number => parseFloat(c)
                ) as [number, number, number, number];
                padding[3] += indent;
                return padding;
            }
        }

        return [0, 0, 0, indent];
    }

    private _deriveSurrogateText(): string {
        if (this._dom_input.value.length === 0) return this._placeholder;

        if ((this._dom_input as HTMLInputElement).type === 'password')
            return '•'.repeat(this._dom_input.value.length);

        return this._dom_input.value;
    }

    private _updateFontMetrics() {
        const style = this._deriveSurrogateStyle();
        const font = (style as any).toFontString
            ? (style as any).toFontString()
            : (style as any).font || '';
        this._font_metrics = CanvasTextMetrics.measureFont(font);
    }

    // CACHING OF INPUT BOX GRAPHICS

    private _buildBoxCache() {
        this._destroyBoxCache();

        const states: BoxState[] = ['DEFAULT', 'FOCUSED', 'DISABLED'];
        const input_bounds = this._getDOMInputBounds();

        for (const state of states) {
            if (!this._box_generator) continue;
            this._box_cache[state] = this._box_generator(input_bounds.width, input_bounds.height, state);
        }

        this._previous.input_bounds = input_bounds;
    }

    private _destroyBoxCache() {
        if (this._box) {
            this.removeChild(this._box);
            this._box = null;
        }

        for (const key in this._box_cache) {
            this._box_cache[key]?.destroy();
            this._box_cache[key] = null;
            delete this._box_cache[key];
        }
    }

    // HELPER FUNCTIONS

    private _hasFocus() {
        return document.activeElement === this._dom_input;
    }

    private _setDOMInputVisible(visible: boolean) {
        this._dom_input.style.display = visible ? 'block' : 'none';
    }

    private _getCanvasBounds() {
        // PIXI v8: renderer.canvas replaces renderer.view for the DOM element
        const canvasEl: HTMLElement =
            (this._last_renderer.canvas as HTMLElement) ??
            (this._last_renderer.view as HTMLElement);
        const rect = canvasEl.getBoundingClientRect();
        const bounds: any = {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        };
        bounds.left += window.scrollX;
        bounds.top += window.scrollY;
        return bounds;
    }

    private _getDOMInputBounds() {
        let remove_after = false;

        if (!this._dom_added) {
            document.body.appendChild(this._dom_input);
            remove_after = true;
        }

        const org_transform = this._dom_input.style.transform;
        const org_display = this._dom_input.style.display;
        this._dom_input.style.transform = '';
        this._dom_input.style.display = 'block';
        const bounds = this._dom_input.getBoundingClientRect();
        this._dom_input.style.transform = org_transform;
        this._dom_input.style.display = org_display;

        if (remove_after) document.body.removeChild(this._dom_input);

        return bounds;
    }

    private _getDOMRelativeWorldTransform() {
        // PIXI v8: renderer.canvas replaces renderer.view
        const canvasEl: HTMLElement =
            (this._last_renderer.canvas as HTMLElement) ??
            (this._last_renderer.view as HTMLElement);
        const canvas_bounds = canvasEl.getBoundingClientRect();

        // worldTransform getter still works in PIXI v8 (returns groupTransform internally)
        const matrix = this.worldTransform.clone();

        matrix.scale(this._resolution || 1, this._resolution || 1);
        matrix.scale(
            canvas_bounds.width / this._last_renderer.width,
            canvas_bounds.height / this._last_renderer.height
        );
        return matrix;
    }

    private _pixiMatrixToCSS(m: Matrix) {
        return 'matrix(' + [m.a, m.b, m.c, m.d, m.tx, m.ty].join(',') + ')';
    }

    private _comparePixiMatrices(m1?: Matrix, m2?: Matrix) {
        if (!m1 || !m2) return false;
        return (
            m1.a == m2.a &&
            m1.b == m2.b &&
            m1.c == m2.c &&
            m1.d == m2.d &&
            m1.tx == m2.tx &&
            m1.ty == m2.ty
        );
    }

    private _compareClientRects(r1?: any, r2?: any) {
        if (!r1 || !r2) return false;
        return (
            r1.left == r2.left &&
            r1.top == r2.top &&
            r1.width == r2.width &&
            r1.height == r2.height
        );
    }
}

/**
 * Builds a Graphics-based box for a given state.
 *
 * PIXI v8: Uses the new Graphics draw API (rect/roundRect + .fill()/.stroke()).
 */
function DefaultBoxGenerator(styles?: any): BoxGenerator {
    styles = styles || { fill: 0xcccccc };

    if (styles.default) {
        styles.focused = styles.focused || styles.default;
        styles.disabled = styles.disabled || styles.default;
    } else {
        const temp_styles = styles;
        styles = {} as any;
        styles.default = styles.focused = styles.disabled = temp_styles;
    }

    return function (w: number, h: number, state: BoxState): Container {
        const style = styles[state.toLowerCase()];
        const box = new Graphics();

        const fillColor: number = style.fill ?? 0xcccccc;

        if (style.stroke) {
            // PIXI v8: stroke is chained after shape draw
            if (style.rounded) {
                box.roundRect(0, 0, w, h, style.rounded)
                    .fill(fillColor)
                    .stroke({
                        width: style.stroke.width ?? 1,
                        color: style.stroke.color ?? 0,
                        alpha: style.stroke.alpha ?? 1,
                    });
            } else {
                box.rect(0, 0, w, h)
                    .fill(fillColor)
                    .stroke({
                        width: style.stroke.width ?? 1,
                        color: style.stroke.color ?? 0,
                        alpha: style.stroke.alpha ?? 1,
                    });
            }
        } else {
            if (style.rounded) {
                box.roundRect(0, 0, w, h, style.rounded).fill(fillColor);
            } else {
                box.rect(0, 0, w, h).fill(fillColor);
            }
        }

        return box;
    };
}
