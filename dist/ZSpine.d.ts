/**
 * ZSpine.ts — PIXI v8 / @esotericsoftware/spine-pixi-v8 port
 *
 * Supports Spine 4.x skeletons only.
 * @esotericsoftware/spine-pixi-v8 re-exports everything from @esotericsoftware/spine-core.
 */
import { SpineData } from "./SceneData";
import { Spine } from "@esotericsoftware/spine-pixi-v8";
export declare class ZSpine {
    private spineData;
    private assetBasePath;
    constructor(spineData: SpineData, assetBasePath: string);
    load(callback: (spine: Spine | undefined) => void): Promise<void>;
    getFileNameWithoutExtension(path: string): string;
}
//# sourceMappingURL=ZSpine.d.ts.map