import { ZState } from "./ZState";
export declare class ZToggle extends ZState {
    private callback?;
    toggleCallback?: (state: boolean) => void;
    /**
     * Initialises the toggle: sets pointer cursor, attaches a click listener
     * that flips between `"onState"` and `"offState"`, and starts in `"offState"`.
     */
    init(): void;
    setCallback(func: (t: boolean) => void): void;
    removeCallback(): void;
    setIsClickable(val: boolean): void;
    isOn(): boolean;
    toggle(state: boolean, sendCallback?: boolean): void;
    enable(): void;
    disable(): void;
    setLabelOnAllStates(label: string, str: string): void;
    getType(): string;
}
//# sourceMappingURL=ZToggle.d.ts.map