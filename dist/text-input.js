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
import { Container, Graphics, Text, TextStyle, CanvasTextMetrics, } from 'pixi.js';
export default class TextInput extends Container {
    // Styles & generators
    _input_style;
    _box_generator;
    styles;
    // DOM
    _dom_input;
    _dom_added = false;
    _dom_visible = true;
    // State
    _multiline;
    _box_cache;
    _previous;
    _placeholder = '';
    _placeholderColor = 0xa9a9a9;
    _selection = [0, 0];
    _restrict_value = '';
    _restrict_regex;
    _substituted = false;
    _disabled = false;
    _max_length;
    // Surrogate
    _surrogate;
    _surrogate_mask;
    _surrogate_hitbox;
    // Internal
    state;
    _box;
    force = false;
    _last_renderer;
    _canvas_bounds;
    _resolution;
    _font_metrics;
    constructor(styles) {
        super();
        this._input_style = Object.assign({
            position: 'absolute',
            background: 'none',
            border: 'none',
            outline: 'none',
            transformOrigin: '0 0',
            lineHeight: '1',
        }, styles.input);
        if (styles.box) {
            this._box_generator =
                typeof styles.box === 'function'
                    ? styles.box
                    : DefaultBoxGenerator(styles.box);
        }
        else {
            this._box_generator = null;
        }
        if (this._input_style.hasOwnProperty('multiline')) {
            this._multiline = !!this._input_style.multiline;
            delete this._input_style.multiline;
        }
        else {
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
        this.onRender = (renderer) => this._renderInternal(renderer);
    }
    setState(state) {
        this._setState(state);
    }
    updateBox(style, state) {
        if (!this.styles.box || typeof this.styles.box === 'function')
            return;
        this.styles.box[state.toLowerCase()] = style;
        const input_bounds = this._getDOMInputBounds();
        if (!this._box_generator)
            return;
        this._box_cache[state] = this._box_generator(input_bounds.width, input_bounds.height, state);
        this.force = true;
    }
    // GETTERS & SETTERS
    get substituteText() {
        return this._substituted;
    }
    set substituteText(substitute) {
        if (this._substituted === substitute)
            return;
        this._substituted = substitute;
        if (substitute) {
            this._createSurrogate();
            this._dom_visible = false;
        }
        else {
            this._destroySurrogate();
            this._dom_visible = true;
        }
        this.placeholder = this._placeholder;
        this._update();
    }
    get placeholder() {
        return this._placeholder;
    }
    set placeholder(text) {
        this._placeholder = text;
        if (this._substituted) {
            this._updateSurrogate();
            this._dom_input.placeholder = '';
        }
        else {
            this._dom_input.placeholder = text;
        }
    }
    get disabled() {
        return this._disabled;
    }
    set disabled(disabled) {
        this._disabled = disabled;
        this._dom_input.disabled = disabled;
        this._setState(disabled ? 'DISABLED' : 'DEFAULT');
    }
    get maxLength() {
        return this._max_length;
    }
    set maxLength(length) {
        this._max_length = length;
        if (length !== undefined) {
            this._dom_input.setAttribute('maxlength', String(length));
        }
        else {
            this._dom_input.removeAttribute('maxlength');
        }
    }
    get restrict() {
        return this._restrict_regex;
    }
    set restrict(regex) {
        if (regex instanceof RegExp) {
            let str = regex.toString().slice(1, -1);
            if (str.charAt(0) !== '^')
                str = '^' + str;
            if (str.charAt(str.length - 1) !== '$')
                str = str + '$';
            this._restrict_regex = new RegExp(str);
        }
        else if (typeof regex === 'string') {
            this._restrict_regex = new RegExp('^[' + regex + ']*$');
        }
        else {
            this._restrict_regex = undefined;
        }
    }
    get text() {
        return this._dom_input.value;
    }
    set text(text) {
        this._dom_input.value = text;
        if (this._substituted)
            this._updateSurrogate();
    }
    get htmlInput() {
        return this._dom_input;
    }
    focus() {
        if (this._substituted && !this._dom_visible)
            this._setDOMInputVisible(true);
        this._dom_input.focus();
    }
    blur() {
        this._dom_input.blur();
    }
    select() {
        this.focus();
        this._dom_input.select();
    }
    setInputStyle(key, value) {
        this._input_style[key] = value;
        this._dom_input.style[key] = value;
        if (this._substituted &&
            (key === 'fontFamily' ||
                key === 'fontSize' ||
                key === 'fontWeight' ||
                key === 'color')) {
            this._updateFontMetrics();
        }
        if (this._last_renderer)
            this._update();
    }
    destroy(options) {
        this._destroyBoxCache();
        super.destroy(options);
    }
    // SETUP
    _createDOMInput() {
        if (this._multiline) {
            const ta = document.createElement('textarea');
            ta.style.resize = 'none';
            this._dom_input = ta;
        }
        else {
            const inp = document.createElement('input');
            inp.type = 'text';
            this._dom_input = inp;
        }
        for (const key in this._input_style) {
            this._dom_input.style[key] = this._input_style[key];
        }
    }
    _addListeners() {
        this.on('added', this._onAdded.bind(this));
        this.on('removed', this._onRemoved.bind(this));
        this._dom_input.addEventListener('keydown', this._onInputKeyDown.bind(this));
        this._dom_input.addEventListener('input', this._onInputInput.bind(this));
        this._dom_input.addEventListener('keyup', this._onInputKeyUp.bind(this));
        this._dom_input.addEventListener('focus', this._onFocused.bind(this));
        this._dom_input.addEventListener('blur', this._onBlurred.bind(this));
    }
    _onInputKeyDown(e) {
        this._selection = [
            this._dom_input.selectionStart,
            this._dom_input.selectionEnd,
        ];
        this.emit('keydown', e.keyCode);
    }
    _onInputInput(_e) {
        if (this._restrict_regex)
            this._applyRestriction();
        if (this._substituted)
            this._updateSubstitution();
        this.emit('input', this.text);
    }
    _onInputKeyUp(e) {
        this.emit('keyup', e.keyCode);
    }
    _onFocused() {
        this._setState('FOCUSED');
        this.emit('focus');
    }
    _onBlurred() {
        this._setState('DEFAULT');
        this.emit('blur');
    }
    _onAdded() {
        document.body.appendChild(this._dom_input);
        this._dom_input.style.display = 'none';
        this._dom_added = true;
    }
    _onRemoved() {
        document.body.removeChild(this._dom_input);
        this._dom_added = false;
    }
    _setState(state) {
        this.state = state;
        this._updateBox();
        if (this._substituted)
            this._updateSubstitution();
    }
    getState() {
        return this.state;
    }
    // RENDER & UPDATE
    _renderInternal(renderer) {
        this._resolution = renderer.resolution;
        this._last_renderer = renderer;
        this._canvas_bounds = this._getCanvasBounds();
        if (this._needsUpdate() || this.force)
            this._update();
    }
    _update() {
        this._updateDOMInput();
        if (this._substituted)
            this._updateSurrogate();
        this._updateBox();
    }
    _updateBox() {
        if (!this._box_generator)
            return;
        if (this._needsNewBoxCache() || this.force)
            this._buildBoxCache();
        if (!this.force && this.state === this._previous.state && this._box === this._box_cache[this.state])
            return;
        if (this._box)
            this.removeChild(this._box);
        this._box = this._box_cache[this.state];
        if (this._box)
            this.addChildAt(this._box, 0);
        this._previous.state = this.state;
        this.force = false;
    }
    _updateSubstitution() {
        if (this.state === 'FOCUSED') {
            this._dom_visible = true;
            if (this._surrogate)
                this._surrogate.visible = this.text.length === 0;
        }
        else {
            this._dom_visible = false;
            if (this._surrogate)
                this._surrogate.visible = true;
        }
        this._updateDOMInput();
        this._updateSurrogate();
    }
    _updateDOMInput() {
        if (!this._canvas_bounds)
            return;
        this._dom_input.style.top = (this._canvas_bounds.top || 0) + 'px';
        this._dom_input.style.left = (this._canvas_bounds.left || 0) + 'px';
        this._dom_input.style.transform = this._pixiMatrixToCSS(this._getDOMRelativeWorldTransform());
        // PIXI v8: worldAlpha → groupAlpha (computed by renderer during traversal)
        const worldAlpha = this.groupAlpha ?? this.alpha;
        const worldVisible = this.groupVisible ?? this.visible;
        this._dom_input.style.opacity = String(worldAlpha);
        this._setDOMInputVisible(worldVisible && this._dom_visible);
        this._previous.canvas_bounds = this._canvas_bounds;
        this._previous.world_transform = this.worldTransform.clone();
        this._previous.world_alpha = worldAlpha;
        this._previous.world_visible = worldVisible;
    }
    _applyRestriction() {
        if (!this._restrict_regex)
            return;
        if (this._restrict_regex.test(this.text)) {
            this._restrict_value = this.text;
        }
        else {
            this.text = this._restrict_value;
            this._dom_input.setSelectionRange(this._selection[0] ?? 0, this._selection[1] ?? 0);
        }
    }
    // STATE COMPARISONS
    _needsUpdate() {
        const worldAlpha = this.groupAlpha ?? this.alpha;
        const worldVisible = this.groupVisible ?? this.visible;
        return (!this._comparePixiMatrices(this.worldTransform, this._previous.world_transform) ||
            !this._compareClientRects(this._canvas_bounds, this._previous.canvas_bounds) ||
            worldAlpha != this._previous.world_alpha ||
            worldVisible != this._previous.world_visible);
    }
    _needsNewBoxCache() {
        const input_bounds = this._getDOMInputBounds();
        return (!this._previous.input_bounds ||
            input_bounds.width != this._previous.input_bounds.width ||
            input_bounds.height != this._previous.input_bounds.height);
    }
    // INPUT SUBSTITUTION
    _createSurrogate() {
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
        if (this._surrogate)
            this._surrogate.mask = this._surrogate_mask;
        this._updateFontMetrics();
        this._updateSurrogate();
    }
    _updateSurrogate() {
        const padding = this._deriveSurrogatePadding();
        const input_bounds = this._getDOMInputBounds();
        if (!this._surrogate)
            return;
        this._surrogate.style = this._deriveSurrogateStyle();
        this._surrogate.style.padding = Math.max(...padding);
        this._surrogate.y = this._multiline
            ? padding[0]
            : (input_bounds.height - this._surrogate.height) / 2;
        this._surrogate.x = padding[3];
        this._surrogate.text = this._deriveSurrogateText();
        switch (this._surrogate.style.align) {
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
    _updateSurrogateHitbox(bounds) {
        if (!this._surrogate_hitbox)
            return;
        // PIXI v8 Graphics API: rect().fill() replaces beginFill/drawRect/endFill
        this._surrogate_hitbox.clear();
        this._surrogate_hitbox.rect(0, 0, bounds.width, bounds.height).fill(0x000000);
        this._surrogate_hitbox.interactive = !this._disabled;
    }
    _updateSurrogateMask(bounds, padding) {
        if (!this._surrogate_mask)
            return;
        // PIXI v8 Graphics API
        this._surrogate_mask.clear();
        this._surrogate_mask
            .rect(padding[3], 0, bounds.width - padding[3] - padding[1], bounds.height)
            .fill(0x000000);
    }
    _destroySurrogate() {
        if (!this._surrogate)
            return;
        if (this._surrogate)
            this.removeChild(this._surrogate);
        if (this._surrogate_mask)
            this.removeChild(this._surrogate_mask);
        if (this._surrogate_hitbox)
            this.removeChild(this._surrogate_hitbox);
        this._surrogate?.destroy();
        this._surrogate_hitbox?.destroy();
        this._surrogate = null;
        this._surrogate_hitbox = null;
    }
    _onSurrogateFocus() {
        this._setDOMInputVisible(true);
        setTimeout(this._ensureFocus.bind(this), 10);
    }
    _ensureFocus() {
        if (!this._hasFocus())
            this.focus();
    }
    _deriveSurrogateStyle() {
        const style = new TextStyle();
        for (const key in this._input_style) {
            switch (key) {
                case 'color':
                    style.fill = this._input_style.color;
                    break;
                case 'fontFamily':
                case 'fontSize':
                case 'fontWeight':
                case 'fontVariant':
                case 'fontStyle':
                    style[key] = this._input_style[key];
                    break;
                case 'letterSpacing':
                    style.letterSpacing = parseFloat(this._input_style.letterSpacing);
                    break;
                case 'textAlign':
                    style.align = this._input_style.textAlign;
                    break;
            }
        }
        if (this._multiline) {
            style.lineHeight = parseFloat(style.fontSize || '0');
            style.wordWrap = true;
            style.wordWrapWidth = this._getDOMInputBounds().width;
        }
        if (this._dom_input.value.length === 0) {
            style.fill = this._placeholderColor;
        }
        return style;
    }
    _deriveSurrogatePadding() {
        const indent = (this._input_style.textIndent
            ? parseFloat(this._input_style.textIndent)
            : 0);
        if (this._input_style.padding && this._input_style.padding.length > 0) {
            const components = this._input_style.padding.trim().split(' ');
            if (components.length == 1) {
                const padding = parseFloat(components[0]);
                return [padding, padding, padding, padding + indent];
            }
            else if (components.length == 2) {
                const paddingV = parseFloat(components[0]);
                const paddingH = parseFloat(components[1]);
                return [paddingV, paddingH, paddingV, paddingH + indent];
            }
            else if (components.length == 4) {
                const padding = components.map((c) => parseFloat(c));
                padding[3] += indent;
                return padding;
            }
        }
        return [0, 0, 0, indent];
    }
    _deriveSurrogateText() {
        if (this._dom_input.value.length === 0)
            return this._placeholder;
        if (this._dom_input.type === 'password')
            return '•'.repeat(this._dom_input.value.length);
        return this._dom_input.value;
    }
    _updateFontMetrics() {
        const style = this._deriveSurrogateStyle();
        const font = style.toFontString
            ? style.toFontString()
            : style.font || '';
        this._font_metrics = CanvasTextMetrics.measureFont(font);
    }
    // CACHING OF INPUT BOX GRAPHICS
    _buildBoxCache() {
        this._destroyBoxCache();
        const states = ['DEFAULT', 'FOCUSED', 'DISABLED'];
        const input_bounds = this._getDOMInputBounds();
        for (const state of states) {
            if (!this._box_generator)
                continue;
            this._box_cache[state] = this._box_generator(input_bounds.width, input_bounds.height, state);
        }
        this._previous.input_bounds = input_bounds;
    }
    _destroyBoxCache() {
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
    _hasFocus() {
        return document.activeElement === this._dom_input;
    }
    _setDOMInputVisible(visible) {
        this._dom_input.style.display = visible ? 'block' : 'none';
    }
    _getCanvasBounds() {
        // PIXI v8: renderer.canvas replaces renderer.view for the DOM element
        const canvasEl = this._last_renderer.canvas ??
            this._last_renderer.view;
        const rect = canvasEl.getBoundingClientRect();
        const bounds = {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        };
        bounds.left += window.scrollX;
        bounds.top += window.scrollY;
        return bounds;
    }
    _getDOMInputBounds() {
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
        if (remove_after)
            document.body.removeChild(this._dom_input);
        return bounds;
    }
    _getDOMRelativeWorldTransform() {
        // PIXI v8: renderer.canvas replaces renderer.view
        const canvasEl = this._last_renderer.canvas ??
            this._last_renderer.view;
        const canvas_bounds = canvasEl.getBoundingClientRect();
        // worldTransform getter still works in PIXI v8 (returns groupTransform internally)
        const matrix = this.worldTransform.clone();
        matrix.scale(this._resolution || 1, this._resolution || 1);
        matrix.scale(canvas_bounds.width / this._last_renderer.width, canvas_bounds.height / this._last_renderer.height);
        return matrix;
    }
    _pixiMatrixToCSS(m) {
        return 'matrix(' + [m.a, m.b, m.c, m.d, m.tx, m.ty].join(',') + ')';
    }
    _comparePixiMatrices(m1, m2) {
        if (!m1 || !m2)
            return false;
        return (m1.a == m2.a &&
            m1.b == m2.b &&
            m1.c == m2.c &&
            m1.d == m2.d &&
            m1.tx == m2.tx &&
            m1.ty == m2.ty);
    }
    _compareClientRects(r1, r2) {
        if (!r1 || !r2)
            return false;
        return (r1.left == r2.left &&
            r1.top == r2.top &&
            r1.width == r2.width &&
            r1.height == r2.height);
    }
}
/**
 * Builds a Graphics-based box for a given state.
 *
 * PIXI v8: Uses the new Graphics draw API (rect/roundRect + .fill()/.stroke()).
 */
function DefaultBoxGenerator(styles) {
    styles = styles || { fill: 0xcccccc };
    if (styles.default) {
        styles.focused = styles.focused || styles.default;
        styles.disabled = styles.disabled || styles.default;
    }
    else {
        const temp_styles = styles;
        styles = {};
        styles.default = styles.focused = styles.disabled = temp_styles;
    }
    return function (w, h, state) {
        const style = styles[state.toLowerCase()];
        const box = new Graphics();
        const fillColor = style.fill ?? 0xcccccc;
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
            }
            else {
                box.rect(0, 0, w, h)
                    .fill(fillColor)
                    .stroke({
                    width: style.stroke.width ?? 1,
                    color: style.stroke.color ?? 0,
                    alpha: style.stroke.alpha ?? 1,
                });
            }
        }
        else {
            if (style.rounded) {
                box.roundRect(0, 0, w, h, style.rounded).fill(fillColor);
            }
            else {
                box.rect(0, 0, w, h).fill(fillColor);
            }
        }
        return box;
    };
}
//# sourceMappingURL=text-input.js.map