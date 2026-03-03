import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";
/**
 * Represents a stateful container that manages its child containers as states.
 * Only one child is visible at any given time.
 */
export class ZState extends ZContainer {
    currentState = null;
    /** Initialises the state container by showing the `"idle"` state. */
    init() {
        this.setState("idle");
    }
    getCurrentState() {
        return this.currentState;
    }
    hasState(str) {
        return this.getChildByName(str) !== null;
    }
    /**
     * Makes the named child visible and hides all others.
     * Falls back to `"idle"`, then the first child.
     */
    setState(str) {
        let chosenChild = this.getChildByName(str);
        if (!chosenChild) {
            chosenChild = this.getChildByName("idle");
            if (!chosenChild && this.children.length > 0) {
                chosenChild = this.getChildAt(0);
            }
        }
        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                let child = this.children[i];
                if (child instanceof ZContainer) {
                    child.setVisible(false);
                }
                else {
                    child.visible = false;
                }
                if (child instanceof ZTimeline) {
                    child.stop();
                }
            }
        }
        if (chosenChild) {
            if (chosenChild instanceof ZContainer) {
                chosenChild.setVisible(true);
            }
            else {
                chosenChild.visible = true;
            }
            this.currentState = chosenChild;
            chosenChild.parent.addChild(chosenChild);
            if (chosenChild instanceof ZTimeline) {
                chosenChild.play();
            }
            return chosenChild;
        }
        return null;
    }
    getAllStateNames() {
        return this.children.map((child) => child.name);
    }
    getType() {
        return "ZState";
    }
}
//# sourceMappingURL=ZState.js.map