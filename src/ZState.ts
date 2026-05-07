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
                    this.stopAllSpineAnims(child);
                } else {
                    child.visible = false;
                }

                if (child instanceof ZTimeline) {
                    (child as ZTimeline).stop();
                    this.stopAllSpineAnims(child);
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
                (chosenChild as ZTimeline).gotoAndPlay(0);
            }
            if (chosenChild instanceof ZContainer) {
                this.playSpines(chosenChild);
            }
            return chosenChild;
        }
        return null;
    }

    private playSpines(container: any): void {
        let drill = true;
        if (container instanceof ZContainer) {
            let spine = container.getSpine();
            if(spine && spine.state)
            {   
                drill = false;
                let spineData = container.getChildSpineData();
                if(spineData.playOnStart && spineData.playOnStart.value){
                    //we need this to happen on the next frame, since stopAllSpineAnims happens now
                    setTimeout(() => {
                        spine!.state.setAnimation(0, spineData.playOnStart!.animation, spineData.playOnStart!.loop);
                    }, 0);                
                }
            }
            
        }
        if(drill && container.children){
            for(let i = 0; i < container.children.length; i++){
                let child = container.children[i];
                this.playSpines(child);
            }
        }
    }

    private stopAllSpineAnims(container: ZContainer): void {
        let spine = container.getSpine();
        if(spine && spine.state)
        {
            spine.state.setEmptyAnimation(0, 0); // Sets empty (no animation) instantly
            spine.state.clearTracks();           // Clears any animations after
            spine.state.clearListeners();        // Optional: clears listeners
            spine.skeleton.setToSetupPose();     // ✅ Reset bones/slots to initial frame
            spine.update(0);

        }
        else{
            for(let i = 0; i < container.children.length; i++){
                let child = container.children[i];
                if(child instanceof ZContainer){
                    this.stopAllSpineAnims(child);
                }
            }
        }
        
    }

    public getAllStateNames(): (string | null)[] {
        return this.children.map((child) => child.name);
    }

    public getType(): string {
        return "ZState";
    }
}
