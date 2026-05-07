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
                    this.stopAllSpineAnims(child);
                }
                else {
                    child.visible = false;
                }
                if (child instanceof ZTimeline) {
                    child.stop();
                    this.stopAllSpineAnims(child);
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
                chosenChild.gotoAndPlay(0);
            }
            if (chosenChild instanceof ZContainer) {
                this.playSpines(chosenChild);
            }
            return chosenChild;
        }
        return null;
    }
    playSpines(container) {
        let drill = true;
        if (container instanceof ZContainer) {
            let spine = container.getSpine();
            if (spine && spine.state) {
                drill = false;
                let spineData = container.getChildSpineData();
                if (spineData.playOnStart && spineData.playOnStart.value) {
                    //we need this to happen on the next frame, since stopAllSpineAnims happens now
                    setTimeout(() => {
                        spine.state.setAnimation(0, spineData.playOnStart.animation, spineData.playOnStart.loop);
                    }, 0);
                }
            }
        }
        if (drill && container.children) {
            for (let i = 0; i < container.children.length; i++) {
                let child = container.children[i];
                this.playSpines(child);
            }
        }
    }
    stopAllSpineAnims(container) {
        let spine = container.getSpine();
        if (spine && spine.state) {
            spine.state.setEmptyAnimation(0, 0); // Sets empty (no animation) instantly
            spine.state.clearTracks(); // Clears any animations after
            spine.state.clearListeners(); // Optional: clears listeners
            spine.skeleton.setToSetupPose(); // ✅ Reset bones/slots to initial frame
            spine.update(0);
        }
        else {
            for (let i = 0; i < container.children.length; i++) {
                let child = container.children[i];
                if (child instanceof ZContainer) {
                    this.stopAllSpineAnims(child);
                }
            }
        }
    }
    getAllStateNames() {
        return this.children.map((child) => child.name);
    }
    getType() {
        return "ZState";
    }
}
//# sourceMappingURL=ZState.js.map