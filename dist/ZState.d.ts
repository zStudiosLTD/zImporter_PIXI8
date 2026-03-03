import { ZContainer } from "./ZContainer";
/**
 * Represents a stateful container that manages its child containers as states.
 * Only one child is visible at any given time.
 */
export declare class ZState extends ZContainer {
    currentState: ZContainer | null;
    /** Initialises the state container by showing the `"idle"` state. */
    init(): void;
    getCurrentState(): ZContainer | null;
    hasState(str: string): boolean;
    /**
     * Makes the named child visible and hides all others.
     * Falls back to `"idle"`, then the first child.
     */
    setState(str: string): ZContainer | null;
    getAllStateNames(): (string | null)[];
    getType(): string;
}
//# sourceMappingURL=ZState.d.ts.map