import { AttachClickListener } from "./ZButton";
import { ZContainer } from "./ZContainer";
import { ZState } from "./ZState";

export class ZToggle extends ZState {
    private callback?: (state: boolean) => void;
    public toggleCallback?: (state: boolean) => void;

    /**
     * Initialises the toggle: sets pointer cursor, attaches a click listener
     * that flips between `"onState"` and `"offState"`, and starts in `"offState"`.
     */
    public init(): void {
        this.cursor = "pointer";
        AttachClickListener(this, () => {
            this.setState(this.currentState!.name === "offState" ? "onState" : "offState");
            if (this.callback) {
                this.callback(this.currentState!.name === "onState");
            }
            if (this.toggleCallback) {
                this.toggleCallback(this.currentState!.name === "onState");
            }
        });
        this.setState("offState");
    }

    setCallback(func: (t: boolean) => void) {
        this.toggleCallback = func;
    }

    removeCallback() {
        this.toggleCallback = undefined;
    }

    setIsClickable(val: boolean) {
        this.interactive = val;
        this.cursor = val ? "pointer" : "default";
    }

    isOn(): boolean {
        return this.currentState!.name === "onState";
    }

    toggle(state: boolean, sendCallback: boolean = true) {
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

    setLabelOnAllStates(label: string, str: string) {
        let containers = this.getAll(label);
        for (let container of containers) {
            (container as ZContainer).setText(str);
        }
    }

    public getType(): string {
        return "ZToggle";
    }
}
