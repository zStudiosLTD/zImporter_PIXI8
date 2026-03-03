import { ZCuePointsManager } from "./ZCuePointsManager";
import { ZContainer } from "./ZContainer";
import { ZUpdatables } from "./ZUpdatables";
export class ZTimeline extends ZContainer {
    totalFrames;
    _frames;
    currentFrame = 0;
    looping = true;
    cuePoints = {};
    func;
    constructor() {
        super();
        this.totalFrames;
        this._frames;
        this.currentFrame = 0;
        this.looping = true;
    }
    setInstanceData(data, orientation) {
        super.setInstanceData(data, orientation);
        if (data.playOnStart) {
            this.play();
        }
    }
    /**
     * Sets cue-point labels keyed by frame number.
     */
    setCuePoints(cuePoints) {
        this.cuePoints = cuePoints;
    }
    getFrames() {
        return this._frames;
    }
    /**
     * Sets the frame data and calculates `totalFrames` as the longest child track.
     */
    setFrames(value) {
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
    removeStateEndEventListener() {
        this.func = undefined;
    }
    addStateEndEventListener(func) {
        this.func = func;
    }
    play() {
        ZUpdatables.addUpdateAble(this);
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child instanceof ZTimeline) {
                child.play();
            }
        }
    }
    stop() {
        ZUpdatables.removeUpdateAble(this);
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child instanceof ZTimeline) {
                child.stop();
            }
        }
    }
    gotoAndPlay(frameNum) {
        this.currentFrame = frameNum;
        ZUpdatables.removeUpdateAble(this);
        this.play();
    }
    update() {
        this.gotoAndStop(this.currentFrame);
        if (this.cuePoints && this.cuePoints[this.currentFrame] !== undefined) {
            ZCuePointsManager.triggerCuePoint(this.cuePoints[this.currentFrame], this);
        }
        this.currentFrame++;
        if (this.currentFrame > this.totalFrames) {
            if (this.looping) {
                this.currentFrame = 0;
            }
            else {
                ZUpdatables.removeUpdateAble(this);
            }
            if (this.func) {
                this.func.call(this, this);
            }
        }
    }
    gotoAndStop(frameNum) {
        this.currentFrame = frameNum;
        if (this._frames != null) {
            for (const k in this._frames) {
                if (this._frames[k][this.currentFrame]) {
                    const frame = this._frames[k][this.currentFrame];
                    if (this[k]) {
                        if (frame.pivotX != undefined)
                            this[k].pivot.x = frame.pivotX;
                        if (frame.pivotY != undefined)
                            this[k].pivot.y = frame.pivotY;
                        if (frame.scaleX != undefined)
                            this[k].scale.x = frame.scaleX;
                        if (frame.scaleY != undefined)
                            this[k].scale.y = frame.scaleY;
                        if (frame.x != undefined)
                            this[k].x = frame.x;
                        if (frame.y != undefined)
                            this[k].y = frame.y;
                        if (frame.alpha != undefined)
                            this[k].alpha = frame.alpha;
                        if (frame.rotation != undefined)
                            this[k].rotation = frame.rotation;
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=ZTimeline.js.map