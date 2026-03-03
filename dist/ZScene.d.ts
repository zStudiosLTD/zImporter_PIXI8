import * as PIXI from "pixi.js";
import { ZContainer } from "./ZContainer";
import { SceneData, TemplateData, AnimTrackData } from "./SceneData";
import { ZNineSlice } from "./ZNineSlice";
/** Locally-defined progress callback type (removed from pixi.js v8 exports). */
export type ProgressCallback = (progress: number) => void;
export type AssetType = "btn" | "asset" | "state" | "toggle" | "none" | "slider" | "scrollBar" | "fullScreen" | "animation";
/**
 * Represents a scene in the application, managing its assets, layout, and lifecycle.
 * Handles loading, resizing, and instantiation of scene elements using PIXI.js v8.
 */
export declare class ZScene {
    static assetTypes: Map<AssetType, any>;
    /** The base path for assets used in the scene, set during loading. */
    private assetBasePath;
    /** The loaded PIXI spritesheet for the scene, or null if not loaded. */
    private scene;
    /** The root container for all scene display objects. */
    private _sceneStage;
    /** The data describing the scene's structure, assets, and templates. */
    private data;
    /** A map of containers that should be resized when the scene resizes. */
    private resizeMap;
    /** Static map of all instantiated scenes by their ID. */
    private static Map;
    /** The unique identifier for this scene. */
    private sceneId;
    /** The current orientation of the scene. */
    private orientation;
    /** The current scene asset name / URL, used for unloading. */
    private sceneName;
    /** Returns the root `ZContainer` that all scene display objects are added to. */
    get sceneStage(): ZContainer;
    constructor(_sceneId: string);
    setOrientation(): void;
    static getSceneById(sceneId: string): ZScene | undefined;
    loadStage(globalStage: PIXI.Container, loadChildren?: boolean): void;
    addToResizeMap(mc: ZContainer | ZNineSlice): void;
    removeFromResizeMap(mc: ZContainer): void;
    getInnerDimensions(): {
        width: number;
        height: number;
    };
    resize(width: number, height: number): void;
    get sceneWidth(): number;
    get sceneHeight(): number;
    load(assetBasePath: string, _loadCompleteFnctn: Function, _updateProgressFnctn?: ProgressCallback): Promise<void>;
    destroy(): Promise<void>;
    loadAssets(assetBasePath: string, placemenisObj: SceneData, _loadCompleteFnctn: Function, _updateProgressFnctn?: ProgressCallback): Promise<void>;
    createFrame(itemName: string): PIXI.Sprite | null;
    private createImagesObject;
    getNumOfFrames(_framePrefix: string): number;
    createMovieClip(_framePrefix: string): PIXI.AnimatedSprite;
    initScene(_placementsObj: SceneData): void;
    getChildrenFrames(_templateName: string): Record<string, AnimTrackData[]>;
    static getAssetType(value: string): any;
    static isAssetType(value: string): value is AssetType;
    spawn(tempName: string): ZContainer | undefined;
    getAllAssets(o: any, allAssets: any): any;
    degreesToRadians(degrees: number): number;
    createAsset(mc: ZContainer, baseNode: TemplateData): Promise<void>;
    private addSlotAttachment;
    applyFilters(obj: any, tf: PIXI.Container): void;
    createBitmapTextFromXML(xmlUrl: string, textToDisplay: string, fontName: string, fontSize: number, callback: Function): Promise<null>;
    /** Loads a texture from a given URL using the PIXI v8 asset loader. */
    loadTexture(textureUrl: string): Promise<PIXI.Texture>;
}
//# sourceMappingURL=ZScene.d.ts.map