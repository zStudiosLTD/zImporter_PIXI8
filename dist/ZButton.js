import { ZContainer } from "./ZContainer";
/**
 * Removes all pointer/touch click listeners attached by `AttachClickListener`.
 */
export const RemoveClickListener = (container) => {
    container.removeAllListeners('mouseup');
    container.removeAllListeners('touchend');
    container.removeAllListeners('touchendoutside');
    container.removeAllListeners('mouseupoutside');
    container.removeAllListeners('mousedown');
    container.removeAllListeners('touchstart');
};
/**
 * Attaches a unified click / long-press listener to any `ZContainer`.
 * A press is only fired if the pointer has not moved more than 20 px (drag guard)
 * and a long-press has not been triggered first.
 */
export const AttachClickListener = (container, pressCallback, longPressCallback) => {
    container.interactive = true;
    container.interactiveChildren = true;
    if (pressCallback)
        container.pressCallback = pressCallback;
    if (longPressCallback)
        container.longPressCallback = longPressCallback;
    let longPressTimer = null;
    const LONG_PRESS_DURATION = 500;
    const MAX_DRAG_DISTANCE = 20;
    let longPressFired = false;
    let startPos = null;
    const getPointerPos = (event) => {
        if (event.data && event.data.global)
            return { x: event.data.global.x, y: event.data.global.y };
        if (event.global)
            return { x: event.global.x, y: event.global.y };
        return null;
    };
    const onPointerDown = (event) => {
        longPressFired = false;
        startPos = getPointerPos(event);
        longPressTimer = setTimeout(() => {
            longPressFired = true;
            if (container.longPressCallback) {
                container.longPressCallback();
            }
        }, LONG_PRESS_DURATION);
        container.on('mouseup', onPointerUp);
        container.on('touchend', onPointerUp);
        container.on('touchendoutside', onPointerUp);
        container.on('mouseupoutside', onPointerUp);
    };
    const onPointerUp = (event) => {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        let isDrag = false;
        const endPos = getPointerPos(event);
        if (startPos && endPos) {
            const dx = endPos.x - startPos.x;
            const dy = endPos.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > MAX_DRAG_DISTANCE)
                isDrag = true;
        }
        startPos = null;
        if (!longPressFired && !isDrag) {
            if (container.pressCallback) {
                container.pressCallback();
            }
        }
        container.off('mouseup', onPointerUp);
        container.off('touchend', onPointerUp);
        container.off('touchendoutside', onPointerUp);
        container.off('mouseupoutside', onPointerUp);
    };
    container.on('mousedown', onPointerDown);
    container.on('touchstart', onPointerDown);
};
/** Attaches `mouseover` and `mouseout` listeners to a container. */
export const AddHoverListener = (container, hoverCallback, outCallback) => {
    container.on('mouseover', hoverCallback);
    container.on('mouseout', outCallback);
};
/** Removes hover listeners attached via `AddHoverListener`. */
export const RemoveHoverListener = (container) => {
    container.removeAllListeners('mouseover');
    container.removeAllListeners('mouseout');
};
export class ZButton extends ZContainer {
    topLabelContainer2;
    topLabelContainer;
    overState;
    overLabelContainer;
    overLabelContainer2;
    downState;
    downLabelContainer;
    downLabelContainer2;
    upState;
    upLabelContainer;
    upLabelContainer2;
    disabledState;
    disabledLabelContainer;
    disabledLabelContainer2;
    pressCallback;
    longPressCallback;
    labelState = "none";
    getType() {
        return "ZButton";
    }
    init(_labelStr = "") {
        super.init();
        this.interactive = true;
        this.interactiveChildren = true;
        if (this.overState) {
            this.overLabelContainer = this.overState?.getChildByName("labelContainer");
            this.overLabelContainer2 = this.overState?.getChildByName("labelContainer2");
        }
        if (this.disabledState) {
            this.disabledLabelContainer = this.disabledState?.getChildByName("labelContainer");
            this.disabledLabelContainer2 = this.disabledState?.getChildByName("labelContainer2");
        }
        if (this.downState) {
            this.downLabelContainer = this.downState?.getChildByName("labelContainer");
            this.downLabelContainer2 = this.downState?.getChildByName("labelContainer2");
        }
        if (this.upState) {
            this.upLabelContainer = this.upState?.getChildByName("labelContainer");
            this.upLabelContainer2 = this.upState?.getChildByName("labelContainer2");
        }
        this.topLabelContainer = this.labelContainer;
        this.topLabelContainer2 = this.labelContainer2;
        if (this.topLabelContainer) {
            this.labelState = "single";
            this.upState.parent.addChild(this.upState);
            this.topLabelContainer.parent.addChild(this.topLabelContainer);
        }
        else if (this.overState && this.disabledState && this.downState && this.upState) {
            if (this.overLabelContainer && this.disabledLabelContainer && this.downLabelContainer && this.upLabelContainer) {
                this.labelState = "multi";
                this.upState.parent.addChild(this.upState);
                if (this.upLabelContainer)
                    this.upState.addChild(this.upLabelContainer);
                if (this.upLabelContainer2)
                    this.upState.addChild(this.upLabelContainer2);
            }
        }
        this.enable();
    }
    setLabel(name) {
        if (this.labelState === "single") {
            const labelContainers = this.getAll("labelContainer");
            labelContainers.forEach(label => {
                label.visible = true;
                label.setText(name);
            });
        }
        else if (this.labelState === "multi") {
            const overLabels = this.overState ? this.overState.getAll("labelContainer") : [];
            const disabledLabels = this.disabledState ? this.disabledState.getAll("labelContainer") : [];
            const downLabels = this.downState ? this.downState.getAll("labelContainer") : [];
            const upLabels = this.upState ? this.upState.getAll("labelContainer") : [];
            [...overLabels, ...disabledLabels, ...downLabels, ...upLabels].forEach(label => {
                label.visible = true;
                label.setText(name);
            });
        }
    }
    setLabel2(name) {
        if (this.labelState === "single") {
            const labelContainers2 = this.getAll("labelContainer2");
            labelContainers2.forEach(label => {
                label.visible = true;
                label.setText(name);
            });
        }
        else if (this.labelState === "multi") {
            const overLabels2 = this.overState ? this.overState.getAll("labelContainer2") : [];
            const disabledLabels2 = this.disabledState ? this.disabledState.getAll("labelContainer2") : [];
            const downLabels2 = this.downState ? this.downState.getAll("labelContainer2") : [];
            const upLabels2 = this.upState ? this.upState.getAll("labelContainer2") : [];
            [...overLabels2, ...disabledLabels2, ...downLabels2, ...upLabels2].forEach(label => {
                label.visible = true;
                label.setText(name);
            });
        }
    }
    setFixedTextSize(fixed) {
        const labelContainers = this.getAll("labelContainer");
        const labelContainers2 = this.getAll("labelContainer2");
        labelContainers.forEach(container => container.setFixedBoxSize(fixed));
        labelContainers2.forEach(container => container.setFixedBoxSize(fixed));
    }
    makeSingleLine() {
        const labelContainers = this.getAll("labelContainer");
        const labelContainers2 = this.getAll("labelContainer2");
        labelContainers2.forEach(label => label.visible = false);
        labelContainers.forEach(label => {
            const parent = label.parent;
            if (parent) {
                label.y = (parent.height) / 2;
            }
        });
    }
    getLabel() {
        if (this.labelState === "single" && this.topLabelContainer) {
            return this.topLabelContainer.getTextField();
        }
        else if (this.labelState === "multi" && this.upLabelContainer) {
            return this.upLabelContainer.getTextField();
        }
        return null;
    }
    getLabel2() {
        if (this.labelState === "single" && this.topLabelContainer2) {
            return this.topLabelContainer2.getTextField();
        }
        else if (this.labelState === "multi" && this.upLabelContainer2) {
            return this.upLabelContainer2.getTextField();
        }
        return null;
    }
    hasLabel() {
        return this.getLabel() !== null;
    }
    hasLabel2() {
        return this.getLabel2() !== null;
    }
    setCallback(func) {
        this.pressCallback = func;
    }
    removeCallback() {
        this.pressCallback = undefined;
    }
    setLongPressCallback(func) {
        this.longPressCallback = func;
    }
    removeLongPressCallback() {
        this.longPressCallback = undefined;
    }
    enable() {
        this.cursor = "pointer";
        [this.upState, this.overState, this.downState].forEach(state => state && (state.cursor = "pointer"));
        this.removeAllListeners();
        let overState = this.overState;
        let downState = this.downState;
        let upState = this.upState;
        let topLabelContainer = this.topLabelContainer;
        let topLabelContainer2 = this.topLabelContainer2;
        let labelState = this.labelState;
        const onOut = () => this.onOut();
        const onOver = () => this.onOver();
        const onDown = () => this.onDown();
        if (overState && upState) {
            this.on('mouseout', onOut);
            this.on('mouseover', onOver);
            this.on('touchendoutside', onOut);
            this.on('touchend', onOut);
        }
        if (downState && upState) {
            this.on('mousedown', onDown);
            this.on('touchstart', onDown);
            this.on('mouseup', onOut);
            this.on('touchendoutside', onOut);
            this.on('touchend', onOut);
        }
        if (upState) {
            this.hideAllStates();
            upState.setVisible(true);
            this.addChild(upState);
        }
        if (labelState === "single" && topLabelContainer) {
            this.addChild(topLabelContainer);
            topLabelContainer.alpha = 1;
            if (topLabelContainer2) {
                this.addChild(topLabelContainer2);
                topLabelContainer2.alpha = 1;
            }
        }
        this.onOut();
        AttachClickListener(this, undefined, undefined);
    }
    disable() {
        this.cursor = "default";
        this.interactive = false;
        [this.upState, this.overState, this.downState].forEach(state => state && (state.cursor = "default"));
        this.removeAllListeners();
        if (this.disabledState) {
            this.hideAllStates();
            this.disabledState.setVisible(true);
            this.addChild(this.disabledState);
        }
        if (this.topLabelContainer) {
            this.addChild(this.topLabelContainer);
            this.topLabelContainer.alpha = 0.5;
        }
        if (this.topLabelContainer2) {
            this.addChild(this.topLabelContainer2);
            this.topLabelContainer2.alpha = 0.5;
        }
    }
    hideAllStates() {
        if (this.overState)
            this.overState.setVisible(false);
        if (this.downState)
            this.downState.setVisible(false);
        if (this.upState)
            this.upState.setVisible(false);
        if (this.disabledState)
            this.disabledState.setVisible(false);
    }
    onDown() {
        if (this.downState) {
            this.hideAllStates();
            this.downState.setVisible(true);
            this.addChild(this.downState);
        }
        if (this.topLabelContainer) {
            this.addChild(this.topLabelContainer);
            this.topLabelContainer.alpha = 0.5;
            if (this.topLabelContainer2) {
                this.addChild(this.topLabelContainer2);
                this.topLabelContainer2.alpha = 0.5;
            }
        }
    }
    onOut() {
        if (this.upState) {
            this.hideAllStates();
            this.upState.setVisible(true);
            this.addChild(this.upState);
        }
        if (this.topLabelContainer) {
            this.addChild(this.topLabelContainer);
            this.topLabelContainer.alpha = 1;
            if (this.topLabelContainer2) {
                this.addChild(this.topLabelContainer2);
                this.topLabelContainer2.alpha = 1;
            }
        }
    }
    onOver() {
        if (this.overState) {
            this.hideAllStates();
            this.overState.setVisible(true);
            this.addChild(this.overState);
        }
        if (this.topLabelContainer) {
            this.addChild(this.topLabelContainer);
            this.topLabelContainer.alpha = 1;
            if (this.topLabelContainer2) {
                this.addChild(this.topLabelContainer2);
                this.topLabelContainer2.alpha = 1;
            }
        }
    }
}
//# sourceMappingURL=ZButton.js.map