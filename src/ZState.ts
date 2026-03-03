import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";

/**
 * Represents a stateful container that manages its child containers as states.
 * Only one child is visible at any given time.
 */
export class ZState extends ZContainer {
    public currentState: ZContainer | null = null;

    /** Initialises the state container by showing the `"idle"` state. */
    public init(): void {
        this.setState("idle");
    }

    public getCurrentState(): ZContainer | null {
        return this.currentState;
    }

    public hasState(str: string): boolean {
        return this.getChildByName(str) !== null;
    }

    /**
     * Makes the named child visible and hides all others.
     * Falls back to `"idle"`, then the first child.
     */
    public setState(str: string): ZContainer | null {
        let chosenChild = this.getChildByName(str) as ZContainer;
        if (!chosenChild) {
            chosenChild = this.getChildByName("idle") as ZContainer;
            if (!chosenChild && this.children.length > 0) {
                chosenChild = this.getChildAt(0) as ZContainer;
            }
        }
        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                let child = this.children[i];
                if (child instanceof ZContainer) {
                    child.setVisible(false);
                } else {
                    child.visible = false;
                }

                if (child instanceof ZTimeline) {
                    (child as ZTimeline).stop();
                }
            }
        }
        if (chosenChild) {
            if (chosenChild instanceof ZContainer) {
                chosenChild.setVisible(true);
            } else {
                (chosenChild as any).visible = true;
            }
            this.currentState = chosenChild;
            chosenChild.parent!.addChild(chosenChild);
            if (chosenChild instanceof ZTimeline) {
                (chosenChild as ZTimeline).play();
            }
            return chosenChild;
        }
        return null;
    }

    public getAllStateNames(): (string | null)[] {
        return this.children.map((child) => child.name);
    }

    public getType(): string {
        return "ZState";
    }
}
