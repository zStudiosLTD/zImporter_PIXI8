import * as PIXI from 'pixi.js';
import { ZContainer } from "./ZContainer";
import TextInput from './text-input';
/**
 * Removes all pointer/touch click listeners attached by `AttachClickListener`.
 */
export declare const RemoveClickListener: (container: ZContainer) => void;
/**
 * Attaches a unified click / long-press listener to any `ZContainer`.
 * A press is only fired if the pointer has not moved more than 20 px (drag guard)
 * and a long-press has not been triggered first.
 */
export declare const AttachClickListener: (container: ZContainer, pressCallback?: () => void, longPressCallback?: () => void) => void;
/** Attaches `mouseover` and `mouseout` listeners to a container. */
export declare const AddHoverListener: (container: ZContainer, hoverCallback: (...args: any[]) => void, outCallback: (...args: any[]) => void) => void;
/** Removes hover listeners attached via `AddHoverListener`. */
export declare const RemoveHoverListener: (container: ZContainer) => void;
export declare class ZButton extends ZContainer {
    topLabelContainer2: ZContainer;
    topLabelContainer: ZContainer;
    overState: ZContainer;
    overLabelContainer: ZContainer;
    overLabelContainer2: ZContainer;
    downState: ZContainer;
    downLabelContainer: ZContainer;
    downLabelContainer2: ZContainer;
    upState: ZContainer;
    upLabelContainer: ZContainer;
    upLabelContainer2: ZContainer;
    disabledState: ZContainer;
    disabledLabelContainer: ZContainer;
    disabledLabelContainer2: ZContainer;
    pressCallback?: () => void;
    longPressCallback?: () => void;
    private labelState;
    getType(): string;
    init(_labelStr?: string): void;
    setLabel(name: string): void;
    setLabel2(name: string): void;
    setFixedTextSize(fixed: boolean): void;
    makeSingleLine(): void;
    getLabel(): PIXI.Text | TextInput | null;
    getLabel2(): PIXI.Text | TextInput | null;
    hasLabel(): boolean;
    hasLabel2(): boolean;
    setCallback(func: () => void): void;
    removeCallback(): void;
    setLongPressCallback(func: () => void): void;
    removeLongPressCallback(): void;
    enable(): void;
    disable(): void;
    hideAllStates(): void;
    onDown(): void;
    onOut(): void;
    onOver(): void;
}
//# sourceMappingURL=ZButton.d.ts.map