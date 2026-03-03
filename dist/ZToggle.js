import { AttachClickListener } from "./ZButton";
import { ZState } from "./ZState";
export class ZToggle extends ZState {
    callback;
    toggleCallback;
    /**
     * Initialises the toggle: sets pointer cursor, attaches a click listener
     * that flips between `"onState"` and `"offState"`, and starts in `"offState"`.
     */
    init() {
        this.cursor = "pointer";
        AttachClickListener(this, () => {
            this.setState(this.currentState.name === "offState" ? "onState" : "offState");
            if (this.callback) {
                this.callback(this.currentState.name === "onState");
            }
            if (this.toggleCallback) {
                this.toggleCallback(this.currentState.name === "onState");
            }
        });
        this.setState("offState");
    }
    setCallback(func) {
        this.toggleCallback = func;
    }
    removeCallback() {
        this.toggleCallback = undefined;
    }
    setIsClickable(val) {
        this.interactive = val;
        this.cursor = val ? "pointer" : "default";
    }
    isOn() {
        return this.currentState.name === "onState";
    }
    toggle(state, sendCallback = true) {
        this.setState(state ? "onState" : "offState");
        if (this.toggleCallback && sendCallback) {
            this.toggleCallback(state);
        }
    }
    enable() {
        this.interactive = true;
        this.cursor = "pointer";
    }
    disable() {
        this.interactive = false;
        this.cursor = "default";
    }
    setLabelOnAllStates(label, str) {
        let containers = this.getAll(label);
        for (let container of containers) {
            container.setText(str);
        }
    }
    getType() {
        return "ZToggle";
    }
}
//# sourceMappingURL=ZToggle.js.map