import { ZCuePointsManager } from "./ZCuePointsManager";
import { ZContainer } from "./ZContainer";
import { ZUpdatables } from "./ZUpdatables";
import { InstanceData } from "./SceneData";

export class ZTimeline extends ZContainer {
    [key: string]: any;
    totalFrames: number | undefined;
    _frames: any;
    currentFrame: number = 0;
    looping: boolean = true;
    cuePoints: Record<number, string> = {};
    func: ((self: ZTimeline) => void) | undefined;

    constructor() {
        super();
        this.totalFrames;
        this._frames;
        this.currentFrame = 0;
        this.looping = true;
    }

    public setInstanceData(data: InstanceData, orientation: string): void {
        super.setInstanceData(data, orientation);
        if (data.playOnStart) {
            this.play();
        }
    }

    /**
     * Sets cue-point labels keyed by frame number.
     */
    setCuePoints(cuePoints: Record<number, string>): void {
        this.cuePoints = cuePoints;
    }

    getFrames(): any {
        return this._frames;
    }

    /**
     * Sets the frame data and calculates `totalFrames` as the longest child track.
     */
    setFrames(value: any): void {
        this._frames = value;
        let totalFrames = 0;
        if (this._frames != null) {
            for (const k in this._frames) {
                if (this._frames[k] instanceof Array) {
                    if (this._frames[k].length > totalFrames) {
                        totalFrames = this._frames[k].length;
                    }
                }
            }
            this.totalFrames = totalFrames;
        }
    }

    removeStateEndEventListener(): void {
        this.func = undefined;
    }

    addStateEndEventListener(func: (self: ZTimeline) => void): void {
        this.func = func;
    }

    play(): void {
        ZUpdatables.addUpdateAble(this);
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child instanceof ZTimeline) {
                child.play();
            }
        }
    }

    stop(): void {
        ZUpdatables.removeUpdateAble(this);
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child instanceof ZTimeline) {
                child.stop();
            }
        }
    }

    gotoAndPlay(frameNum: number): void {
        this.currentFrame = frameNum;
        ZUpdatables.removeUpdateAble(this);
        this.play();
    }

    update(): void {
        this.gotoAndStop(this.currentFrame);
        if (this.cuePoints && this.cuePoints[this.currentFrame] !== undefined) {
            ZCuePointsManager.triggerCuePoint(this.cuePoints[this.currentFrame], this);
        }
        this.currentFrame++;

        if (this.currentFrame > this.totalFrames!) {
            if (this.looping) {
                this.currentFrame = 0;
            } else {
                ZUpdatables.removeUpdateAble(this);
            }

            if (this.func) {
                this.func.call(this, this);
            }
        }
    }

    gotoAndStop(frameNum: number): void {
        this.currentFrame = frameNum;
        if (this._frames != null) {
            for (const k in this._frames) {
                if (this._frames[k][this.currentFrame]) {
                    const frame = this._frames[k][this.currentFrame];

                    if (this[k]) {
                        if (frame.pivotX != undefined) this[k].pivot.x = frame.pivotX;
                        if (frame.pivotY != undefined) this[k].pivot.y = frame.pivotY;
                        if (frame.scaleX != undefined) this[k].scale.x = frame.scaleX;
                        if (frame.scaleY != undefined) this[k].scale.y = frame.scaleY;
                        if (frame.x != undefined) this[k].x = frame.x;
                        if (frame.y != undefined) this[k].y = frame.y;
                        if (frame.alpha != undefined) this[k].alpha = frame.alpha;
                        if (frame.rotation != undefined) this[k].rotation = frame.rotation;
                    }
                }
            }
        }
    }
}
