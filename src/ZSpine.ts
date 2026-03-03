/**
 * ZSpine.ts — PIXI v8 / @esotericsoftware/spine-pixi-v8 port
 *
 * Supports Spine 4.x skeletons only.
 * @esotericsoftware/spine-pixi-v8 re-exports everything from @esotericsoftware/spine-core.
 */

import { SpineData } from "./SceneData";
import {
    Spine,
    SpineTexture,
    TextureAtlas,
    TextureAtlasPage,
    TextureAtlasRegion,
    AtlasAttachmentLoader,
    SkeletonJson,
} from "@esotericsoftware/spine-pixi-v8";
import * as PIXI from "pixi.js";

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Create and append a full-texture atlas region to `page` & `atlas`.
 * If page.setTexture() was already called, propagates texture to the new region.
 */
function addRegion(
    atlas: TextureAtlas,
    page: TextureAtlasPage,
    name: string
): TextureAtlasRegion {
    const region = new TextureAtlasRegion(page, name); // auto-pushes to page.regions
    region.x = 0;
    region.y = 0;
    region.width = page.width;
    region.height = page.height;
    region.originalWidth = page.width;
    region.originalHeight = page.height;
    region.u = 0;
    region.v = 0;
    region.u2 = 1;
    region.v2 = 1;
    if (page.texture) region.texture = page.texture;
    atlas.regions.push(region);
    return region;
}

/**
 * Build a TextureAtlas from a map of { name => PIXI.Texture }.
 * Each entry becomes its own atlas page (full-frame region).
 */
function buildAtlasFromTextures(
    textures: Record<string, PIXI.Texture>
): { atlas: TextureAtlas; nameToPage: Map<string, TextureAtlasPage> } {
    const atlas = new TextureAtlas("\n"); // minimal empty atlas
    const nameToPage = new Map<string, TextureAtlasPage>();

    for (const [name, pixiTexture] of Object.entries(textures)) {
        const w = Math.max(1, pixiTexture.width);
        const h = Math.max(1, pixiTexture.height);

        const page = new TextureAtlasPage(name);
        page.width = w;
        page.height = h;
        atlas.pages.push(page);
        nameToPage.set(name, page);

        // Create region BEFORE setTexture so texture propagates to it
        addRegion(atlas, page, name);
        page.setTexture(SpineTexture.from(pixiTexture.source));
    }

    return { atlas, nameToPage };
}

// ─── ZSpine ─────────────────────────────────────────────────────────────────

export class ZSpine {
    private spineData: SpineData;
    private assetBasePath: string;

    constructor(spineData: SpineData, assetBasePath: string) {
        this.spineData = spineData;
        this.assetBasePath = assetBasePath;
    }

    async load(callback: (spine: Spine | undefined) => void): Promise<void> {
        const spineData = this.spineData;
        const assetBasePath = this.assetBasePath;

        /** Configure and return the finished Spine instance. */
        const onSpineLoaded = (spine: Spine) => {
            spine.name = spineData.name;
            // eventMode is properly typed in PIXI v8
            spine.eventMode = "none";

            if (spineData.skin) {
                spine.skeleton.setSkinByName(spineData.skin);
                spine.skeleton.setSlotsToSetupPose();
            }
            if (spineData.playOnStart?.value) {
                spine.state.setAnimation(0, spineData.playOnStart.animation, true);
            }
            callback(spine);
        };

        // ── Atlas-file path ──────────────────────────────────────────────────
        if (spineData.spineAtlas && spineData.spineAtlas !== "") {
            try {
                const atlasFullPath = assetBasePath + spineData.spineAtlas;
                const atlasDir =
                    atlasFullPath.substring(0, atlasFullPath.lastIndexOf("/") + 1);

                const [atlasText, rawSkeletonData] = await Promise.all([
                    fetch(atlasFullPath).then((r) => {
                        if (!r.ok)
                            throw new Error(`Failed to fetch atlas: ${r.statusText}`);
                        return r.text();
                    }),
                    fetch(assetBasePath + spineData.spineJson).then((r) => {
                        if (!r.ok)
                            throw new Error(`Failed to fetch spine JSON: ${r.statusText}`);
                        return r.json();
                    }),
                ]);

                // Parse atlas text; atlas.pages will contain one entry per PNG page
                const atlas = new TextureAtlas(atlasText);

                // Load each atlas page texture and bind it
                await Promise.all(
                    atlas.pages.map(async (page) => {
                        const tex: PIXI.Texture = await PIXI.Assets.load(
                            atlasDir + page.name
                        );
                        page.setTexture(SpineTexture.from(tex.source));
                    })
                );

                const attachmentLoader = new AtlasAttachmentLoader(atlas);
                const parser = new SkeletonJson(attachmentLoader);
                const skeletonData = parser.readSkeletonData(rawSkeletonData);

                onSpineLoaded(new Spine(skeletonData));
            } catch (error) {
                console.error("Error loading Spine data:", error);
                callback(undefined);
            }

            return;
        }

        // ── PNG-files path ───────────────────────────────────────────────────
        if (spineData.pngFiles && spineData.pngFiles.length) {
            const defaultTexture = PIXI.Texture.EMPTY;
            const textures: Record<string, PIXI.Texture> = {};

            // Load all PNG textures concurrently via PIXI.Assets (PIXI v8)
            await Promise.all(
                spineData.pngFiles.map((file) =>
                    PIXI.Assets.load<PIXI.Texture>(assetBasePath + file).then((texture) => {
                        textures[this.getFileNameWithoutExtension(file)] = texture;
                    })
                )
            );

            // Validate folder structure (spine JSON must sit in a folder with matching name)
            const spineFolderFullPath =
                assetBasePath +
                spineData.spineJson.substring(0, spineData.spineJson.lastIndexOf("/"));
            const spineFolderName = spineFolderFullPath.substring(
                spineFolderFullPath.lastIndexOf("/") + 1
            );
            const spineJsonName = this.getFileNameWithoutExtension(spineData.spineJson);
            if (spineFolderName !== spineJsonName) {
                alert(
                    `Spine JSON file "${spineData.spineJson}" should be in a folder named "${spineJsonName}".`
                );
                return;
            }

            const rawSkeletonData = await (
                await fetch(assetBasePath + spineData.spineJson)
            ).json();

            // Build atlas from loaded PNG textures
            const { atlas, nameToPage } = buildAtlasFromTextures(textures);

            // Lazy default page for unresolved attachments
            let defPage: TextureAtlasPage | null = null;
            const ensureDefPage = (): TextureAtlasPage => {
                if (!defPage) {
                    defPage = new TextureAtlasPage("_default");
                    defPage.width = 1;
                    defPage.height = 1;
                    defPage.setTexture(SpineTexture.from(defaultTexture.source));
                    atlas.pages.push(defPage);
                }
                return defPage;
            };

            // Ensure every skin attachment has a region
            let missing = "";
            for (const skinName of Object.keys(rawSkeletonData.skins ?? {})) {
                const skin = (rawSkeletonData.skins as Record<string, any>)[skinName];
                if (!skin.attachments) continue;
                for (const slotName of Object.keys(skin.attachments)) {
                    const attachmentsForSlot = skin.attachments[slotName] as Record<
                        string,
                        unknown
                    >;
                    for (const attachmentName of Object.keys(attachmentsForSlot)) {
                        if (atlas.findRegion(attachmentName)) continue;
                        const page = nameToPage.get(attachmentName);
                        if (page) {
                            addRegion(atlas, page, attachmentName);
                        } else {
                            addRegion(atlas, ensureDefPage(), attachmentName);
                            if (missing.indexOf(attachmentName) === -1)
                                missing += attachmentName + ", ";
                            console.warn(attachmentName + " not found in loaded textures.");
                        }
                    }
                }
            }

            // Numbered frame aliasing: "win_reel0" -> also register "win_reel"
            for (const [name, page] of nameToPage) {
                const match = name.match(/^(.*?)(\d+)$/);
                if (match && parseInt(match[2], 10) === 0) {
                    const baseName = match[1];
                    if (!atlas.findRegion(baseName)) {
                        addRegion(atlas, page, baseName);
                        console.warn(`Aliased base region "${baseName}" -> "${name}"`);
                    }
                }
            }

            const attachmentLoader = new AtlasAttachmentLoader(atlas);
            const parser = new SkeletonJson(attachmentLoader);
            const skeletonData = parser.readSkeletonData(rawSkeletonData);
            onSpineLoaded(new Spine(skeletonData));
        }
    }

    getFileNameWithoutExtension(path: string): string {
        const lastSlash = path.lastIndexOf("/");
        const fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
        const lastDot = fileName.lastIndexOf(".");
        return lastDot >= 0 ? fileName.substring(0, lastDot) : fileName;
    }
}
