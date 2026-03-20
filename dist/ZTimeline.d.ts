import * as PIXI from "pixi.js";
import { ZContainer } from "./ZContainer";
import { InstanceData } from "./SceneData";
export declare class ZTimeline extends ZContainer {
    [key: string]: any;
    totalFrames: number | undefined;
    _frames: any;
    currentFrame: number;
    looping: boolean;
    cuePoints: Record<number, string>;
    func: ((self: ZTimeline) => void) | undefined;
    constructor();
    setInstanceData(data: InstanceData, orientation: string): void;
    /**
     * Sets cue-point labels keyed by frame number.
     */
    setCuePoints(cuePoints: Record<number, string>): void;
    getFrames(): any;
    /**
     * Sets the frame data and calculates `totalFrames` as the longest child track.
     */
    setFrames(value: any): void;
    removeStateEndEventListener(): void;
    addStateEndEventListener(func: (self: ZTimeline) => void): void;
    play(): void;
    stop(): void;
    gotoAndPlay(frameNum: number): void;
    update(): void;
    gotoAndStop(frameNum: number): void;
    destroy(options?: Parameters<PIXI.Container['destroy']>[0]): void;
}
//# sourceMappingURL=ZTimeline.d.ts.map