import { DropShadowFilter } from "pixi-filters";
import * as PIXI from "pixi.js";
import { FillGradient } from "pixi.js";
import { ZButton } from "./ZButton";
import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";
import { ZState } from "./ZState";
import { ZToggle } from "./ZToggle";
import { ZSlider } from "./ZSlider";
import { ZScroll } from "./ZScroll";
import { ZTextInput } from "./ZTextInput";
import { ZNineSlice } from "./ZNineSlice";
import { ZSpine } from "./ZSpine";
/**
 * Represents a scene in the application, managing its assets, layout, and lifecycle.
 * Handles loading, resizing, and instantiation of scene elements using PIXI.js v8.
 */
export class ZScene {
    static assetTypes = new Map([
        ["btn", ZButton],
        ["asset", ZContainer],
        ["state", ZState],
        ["toggle", ZToggle],
        ["slider", ZSlider],
        ["scrollBar", ZScroll],
        ["fullScreen", ZContainer],
        ["animation", ZTimeline],
    ]);
    /** The base path for assets used in the scene, set during loading. */
    assetBasePath = "";
    /** The loaded PIXI spritesheet for the scene, or null if not loaded. */
    scene = null;
    /** The root container for all scene display objects. */
    _sceneStage = new ZContainer();
    /** The data describing the scene's structure, assets, and templates. */
    data;
    /** A map of containers that should be resized when the scene resizes. */
    resizeMap = new Map();
    /** Static map of all instantiated scenes by their ID. */
    static Map = new Map();
    /** The unique identifier for this scene. */
    sceneId;
    /** The current orientation of the scene. */
    orientation = "portrait";
    /** The current scene asset name / URL, used for unloading. */
    sceneName = null;
    /** Returns the root `ZContainer` that all scene display objects are added to. */
    get sceneStage() {
        return this._sceneStage;
    }
    constructor(_sceneId) {
        this.sceneId = _sceneId;
        this.setOrientation();
        ZScene.Map.set(_sceneId, this);
    }
    setOrientation() {
        this.orientation =
            window.innerWidth > window.innerHeight ? "landscape" : "portrait";
    }
    static getSceneById(sceneId) {
        return ZScene.Map.get(sceneId);
    }
    loadStage(globalStage, loadChildren = true) {
        this.resize(window.innerWidth, window.innerHeight);
        const stageAssets = this.data.stage;
        const children = stageAssets?.children;
        if (children && loadChildren) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.guide)
                    continue;
                const tempName = child.name;
                const mc = this.spawn(tempName);
                if (mc) {
                    mc.setInstanceData(child, this.orientation);
                    this.addToResizeMap(mc);
                    this._sceneStage.addChild(mc);
                    this._sceneStage[mc.name] = mc;
                }
            }
        }
        globalStage.addChild(this._sceneStage);
        this.resize(window.innerWidth, window.innerHeight);
    }
    addToResizeMap(mc) {
        this.resizeMap.set(mc, true);
    }
    removeFromResizeMap(mc) {
        this.resizeMap.delete(mc);
    }
    getInnerDimensions() {
        let baseWidth = this.data.resolution.x;
        let baseHeight = this.data.resolution.y;
        if (this.orientation === "portrait") {
            baseWidth = this.data.resolution.y;
            baseHeight = this.data.resolution.x;
        }
        return { width: baseWidth, height: baseHeight };
    }
    resize(width, height) {
        if (this.data && this.data.resolution) {
            this.setOrientation();
            let baseWidth = this.data.resolution.x;
            let baseHeight = this.data.resolution.y;
            if (this.orientation === "portrait") {
                baseWidth = this.data.resolution.y;
                baseHeight = this.data.resolution.x;
            }
            const scaleX = width / baseWidth;
            const scaleY = height / baseHeight;
            const scale = Math.min(scaleX, scaleY);
            this._sceneStage.scale.x = scale;
            this._sceneStage.scale.y = scale;
            this._sceneStage.x = (width - baseWidth * scale) / 2;
            this._sceneStage.y = (height - baseHeight * scale) / 2;
            for (const [mc] of this.resizeMap) {
                mc.resize(width, height, this.orientation);
            }
        }
    }
    get sceneWidth() {
        let baseWidth = this.data.resolution.x;
        if (this.orientation === "portrait") {
            baseWidth = this.data.resolution.y;
        }
        return baseWidth;
    }
    get sceneHeight() {
        let baseHeight = this.data.resolution.y;
        if (this.orientation === "portrait") {
            baseHeight = this.data.resolution.x;
        }
        return baseHeight;
    }
    async load(assetBasePath, _loadCompleteFnctn, _updateProgressFnctn) {
        this.assetBasePath = assetBasePath;
        const placementsUrl = assetBasePath + "placements.json?rnd=" + Math.random();
        fetch(placementsUrl)
            .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
            .then((placemenisObj) => {
            this.loadAssets(assetBasePath, placemenisObj, _loadCompleteFnctn, _updateProgressFnctn);
        })
            .catch((_error) => {
            // handle gracefully
        });
    }
    async destroy() {
        const spritesheet = this.scene;
        if (spritesheet) {
            await spritesheet.parse();
            // Destroy individual textures
            for (const textureName in spritesheet.textures) {
                spritesheet.textures[textureName].destroy();
            }
            // PIXI v8: destroy the spritesheet (no baseTexture property)
            spritesheet.destroy(true);
        }
        await PIXI.Assets.unload(this.sceneName);
    }
    async loadAssets(assetBasePath, placemenisObj, _loadCompleteFnctn, _updateProgressFnctn) {
        const _jsonPath = assetBasePath + "ta.json?rnd=" + Math.random();
        let isAtlas = placemenisObj.atlas;
        if (isAtlas === null || isAtlas === undefined) {
            isAtlas = true;
        }
        if (isAtlas) {
            try {
                this.scene = await PIXI.Assets.load(_jsonPath, _updateProgressFnctn);
            }
            catch (err) {
                console.error("Error loading spritesheet:", err);
            }
        }
        else {
            const imagesObj = this.createImagesObject(assetBasePath, placemenisObj);
            try {
                this.scene = await PIXI.Assets.load(imagesObj, _updateProgressFnctn);
                this.scene.textures = this.scene;
            }
            catch (err) {
                console.error("Error loading images:", err);
            }
        }
        this.sceneName = _jsonPath;
        if (placemenisObj.fonts.length === 0) {
            this.initScene(placemenisObj);
            _loadCompleteFnctn();
            return;
        }
        for (let i = 0; i < placemenisObj.fonts.length; i++) {
            const fontName = placemenisObj.fonts[i];
            const fntUrl = assetBasePath + "bitmapFonts/" + fontName + ".fnt";
            const pngUrl = assetBasePath + "bitmapFonts/" + fontName + ".png";
            let xmlString;
            try {
                const response = await fetch(fntUrl);
                if (!response.ok)
                    throw new Error(`Failed to fetch font XML: ${response.statusText}`);
                xmlString = await response.text();
            }
            catch (err) {
                console.error("Error fetching font XML:", err);
                continue;
            }
            let texture;
            try {
                texture = await PIXI.Assets.load(pngUrl);
            }
            catch (err) {
                console.error("Error loading font texture:", err);
                continue;
            }
            // PIXI v8: BitmapFont.available was removed; fall back via cache check via any
            if (!PIXI.BitmapFont.available?.[fontName]) {
                try {
                    // PIXI v8: install takes an options object
                    PIXI.BitmapFont.install({
                        data: xmlString,
                        textures: texture,
                    });
                }
                catch (err) {
                    console.error("Error installing bitmap font:", err);
                }
            }
            if (i === placemenisObj.fonts.length - 1) {
                this.initScene(placemenisObj);
                _loadCompleteFnctn();
            }
        }
    }
    createFrame(itemName) {
        return new PIXI.Sprite(this.scene.textures[itemName]);
    }
    createImagesObject(assetBasePath, obj) {
        const images = [];
        const record = {};
        const templates = obj.templates;
        for (const template in templates) {
            const children = templates[template].children;
            for (const child in children) {
                const childObj = children[child];
                if (childObj.type === "img" || childObj.type === "9slice") {
                    const imgData = childObj;
                    if (!record[imgData.name]) {
                        record[imgData.name] = true;
                        let texName = imgData.name.endsWith("_9S")
                            ? imgData.name.slice(0, -3)
                            : imgData.name;
                        texName = texName.endsWith("_IMG")
                            ? texName.slice(0, -4)
                            : texName;
                        images.push({
                            alias: texName,
                            src: assetBasePath + imgData.filePath,
                        });
                    }
                }
            }
        }
        return images;
    }
    getNumOfFrames(_framePrefix) {
        let num = 0;
        const a = this.scene.data;
        for (const k in a) {
            if (k.indexOf(_framePrefix) !== -1) {
                num++;
            }
        }
        return num;
    }
    createMovieClip(_framePrefix) {
        const frames = [];
        const numFrames = this.getNumOfFrames(_framePrefix);
        for (let i = 0; i < numFrames; i++) {
            const val = i < 10 ? "0" + i : i;
            const textureName = _framePrefix + "00" + val;
            frames.push(PIXI.Texture.from(textureName));
        }
        const mc = new PIXI.AnimatedSprite(frames);
        mc.animationSpeed = 1;
        mc.loop = false;
        mc.name = _framePrefix;
        return mc;
    }
    initScene(_placementsObj) {
        this.data = _placementsObj;
    }
    getChildrenFrames(_templateName) {
        const frames = {};
        const templates = this.data.templates;
        const animTracks = this.data.animTracks;
        const baseNode = templates[_templateName];
        if (baseNode && baseNode.children) {
            for (let i = 0; i < baseNode.children.length; i++) {
                const childNode = baseNode.children[i];
                const childInstanceName = childNode.instanceName;
                const combinedName = childInstanceName + "_" + _templateName;
                if (animTracks[combinedName]) {
                    frames[childInstanceName] = animTracks[combinedName];
                }
                else {
                    // Fallback: the template name may contain underscores, causing the
                    // exporter (which splits on the last '_') to store the key with only
                    // part of the template name as the suffix. Re-derive the correct key
                    // by matching against all known template names.
                    for (const knownTemplate of Object.keys(templates)) {
                        const suffix = "_" + knownTemplate;
                        const candidateKey = childInstanceName + suffix;
                        if (animTracks[candidateKey]) {
                            frames[childInstanceName] = animTracks[candidateKey];
                            break;
                        }
                    }
                }
            }
        }
        return frames;
    }
    static getAssetType(value) {
        if (this.assetTypes.has(value)) {
            return this.assetTypes.get(value);
        }
        return null;
    }
    static isAssetType(value) {
        return this.assetTypes.has(value);
    }
    spawn(tempName) {
        const templates = this.data.templates;
        const baseNode = templates[tempName];
        if (!baseNode) {
            return;
        }
        let mc;
        const frames = this.getChildrenFrames(tempName);
        if (Object.keys(frames).length > 0) {
            mc = new ZTimeline();
            this.createAsset(mc, baseNode);
            mc.setFrames(frames);
            if (this.data.cuePoints && this.data.cuePoints[tempName]) {
                mc.setCuePoints(this.data.cuePoints[tempName]);
            }
            mc.gotoAndStop(0);
        }
        else {
            mc = new (ZScene.getAssetType(baseNode.type) || ZContainer)();
            this.createAsset(mc, baseNode);
            mc.init();
        }
        return mc;
    }
    getAllAssets(o, allAssets) {
        for (const k in o) {
            if (k === "type" && o[k] === "asset") {
                allAssets[o["name"]] = o;
            }
            if (o[k] instanceof Object) {
                this.getAllAssets(o[k], allAssets);
            }
        }
        return allAssets;
    }
    degreesToRadians(degrees) {
        return (degrees * Math.PI) / 180;
    }
    async createAsset(mc, baseNode) {
        for (let i = 0; i < baseNode.children.length; i++) {
            const childNode = baseNode.children[i];
            const _name = childNode.name;
            const type = childNode.type;
            let asset;
            if (type === "inputField") {
                const inputData = childNode;
                asset = new ZTextInput(inputData);
                asset.name = _name;
                mc[_name] = asset;
                mc.addChild(asset);
                this.applyFilters(childNode, asset);
            }
            if (type === "bitmapFontLocked") {
                const textInstanceNode = childNode;
                if (textInstanceNode.fontName &&
                    PIXI.BitmapFont.available?.[textInstanceNode.fontName]) {
                    // PIXI v8: BitmapText constructor takes an options object
                    const tf = new PIXI.BitmapText({
                        text: textInstanceNode.text || "",
                        style: {
                            fontFamily: textInstanceNode.fontName,
                            align: textInstanceNode.align || "left",
                        },
                    });
                    if (textInstanceNode.textAnchorX !== undefined &&
                        textInstanceNode.textAnchorY !== undefined) {
                        tf.anchor.set(textInstanceNode.textAnchorX, textInstanceNode.textAnchorY);
                    }
                    if (textInstanceNode.pivotX !== undefined &&
                        textInstanceNode.pivotY !== undefined) {
                        tf.pivot.set(textInstanceNode.pivotX, textInstanceNode.pivotY);
                    }
                    tf.name = _name;
                    mc[_name] = tf;
                    mc.addChild(tf);
                    if (textInstanceNode.x !== undefined)
                        tf.x = textInstanceNode.x;
                    if (textInstanceNode.y !== undefined)
                        tf.y = textInstanceNode.y;
                    this.applyFilters(childNode, tf);
                }
            }
            if (type === "bitmapText" || type === "textField") {
                const textInstanceNode = childNode;
                if (textInstanceNode.uniqueFontName &&
                    PIXI.BitmapFont.available?.[textInstanceNode.uniqueFontName]) {
                    // PIXI v8: BitmapText constructor takes an options object
                    const tf = new PIXI.BitmapText({
                        text: textInstanceNode.text || "",
                        style: {
                            fontFamily: textInstanceNode.uniqueFontName,
                            fontSize: textInstanceNode.size,
                            letterSpacing: textInstanceNode.letterSpacing || 0,
                            align: textInstanceNode.align || "left",
                        },
                    });
                    if (textInstanceNode.textAnchorX !== undefined &&
                        textInstanceNode.textAnchorY !== undefined) {
                        tf.anchor.set(textInstanceNode.textAnchorX, textInstanceNode.textAnchorY);
                    }
                    if (textInstanceNode.pivotX !== undefined &&
                        textInstanceNode.pivotY !== undefined) {
                        tf.pivot.set(textInstanceNode.pivotX, textInstanceNode.pivotY);
                    }
                    tf.name = _name;
                    mc[_name] = tf;
                    mc.addChild(tf);
                    tf.x = textInstanceNode.x;
                    tf.y = textInstanceNode.y;
                    this.applyFilters(childNode, tf);
                }
                else {
                    // PIXI v8 TextStyle is constructed differently
                    const style = {
                        fontFamily: textInstanceNode.fontName,
                        fontSize: textInstanceNode.size,
                        align: "center",
                    };
                    if (textInstanceNode.size) {
                        style.fontSize = textInstanceNode.size;
                    }
                    if (textInstanceNode.color ||
                        textInstanceNode.fillType === "solid") {
                        style.fill = textInstanceNode.color;
                    }
                    if (textInstanceNode.fillType === "gradient" &&
                        textInstanceNode.gradientData) {
                        // PIXI v8: use FillGradient for gradient fills
                        const gradient = new FillGradient(0, 0, 0, Number(textInstanceNode.size) || 16);
                        gradient.addColorStop(textInstanceNode.gradientData.percentages[0], textInstanceNode.gradientData.colors[0]);
                        gradient.addColorStop(textInstanceNode.gradientData.percentages[1], textInstanceNode.gradientData.colors[1]);
                        style.fill = gradient;
                    }
                    if (textInstanceNode.align) {
                        style.align = textInstanceNode.align;
                    }
                    // PIXI v8: stroke is an object { color, width }
                    if (textInstanceNode.stroke ||
                        textInstanceNode.strokeThickness) {
                        style.stroke = {
                            color: textInstanceNode.stroke || "#000000",
                            width: textInstanceNode.strokeThickness || 1,
                        };
                    }
                    if (textInstanceNode.wordWrap) {
                        style.wordWrap = textInstanceNode.wordWrap;
                    }
                    if (textInstanceNode.wordWrapWidth) {
                        style.wordWrapWidth = textInstanceNode.wordWrapWidth;
                    }
                    if (textInstanceNode.breakWords) {
                        style.breakWords = textInstanceNode.breakWords;
                    }
                    if (textInstanceNode.leading) {
                        style.leading = textInstanceNode.leading;
                    }
                    if (textInstanceNode.letterSpacing) {
                        style.letterSpacing = textInstanceNode.letterSpacing;
                    }
                    if (textInstanceNode.padding) {
                        style.padding = textInstanceNode.padding;
                    }
                    if (textInstanceNode.fontWeight) {
                        style.fontWeight = textInstanceNode.fontWeight;
                    }
                    // PIXI v8: dropShadow is an object { alpha, angle, blur, color, distance }
                    if (textInstanceNode.dropShadow) {
                        style.dropShadow = {
                            alpha: 1,
                            angle: textInstanceNode.dropShadowAngle || 0,
                            blur: textInstanceNode.dropShadowBlur || 0,
                            color: textInstanceNode.dropShadowColor || "#000000",
                            distance: textInstanceNode.dropShadowDistance || 0,
                        };
                    }
                    // PIXI v8: Text constructor takes an options object
                    const tf = new PIXI.Text({
                        text: textInstanceNode.text + "",
                        style,
                    });
                    if (textInstanceNode.textAnchorX !== undefined &&
                        textInstanceNode.textAnchorY !== undefined) {
                        tf.anchor.set(textInstanceNode.textAnchorX, textInstanceNode.textAnchorY);
                    }
                    if (textInstanceNode.pivotX !== undefined &&
                        textInstanceNode.pivotY !== undefined) {
                        tf.pivot.set(textInstanceNode.pivotX, textInstanceNode.pivotY);
                    }
                    tf.name = _name;
                    tf.x = textInstanceNode.x;
                    tf.y = textInstanceNode.y;
                    mc[_name] = tf;
                    mc.addChild(tf);
                    this.applyFilters(childNode, tf);
                }
            }
            if (type === "img") {
                const spriteData = childNode;
                const _w = spriteData.width;
                const _h = spriteData.height;
                const _x = spriteData.x || 0;
                const _y = spriteData.y || 0;
                const pivotX = spriteData.pivotX || 0;
                const pivotY = spriteData.pivotY || 0;
                let texName = _name;
                texName = texName.endsWith("_IMG")
                    ? texName.slice(0, -4)
                    : texName;
                const img = this.createFrame(texName);
                if (!img) {
                    return;
                }
                img.name = _name;
                mc[texName] = img;
                mc.addChild(img);
                img.x = _x;
                img.y = _y;
                img.width = _w;
                img.height = _h;
                img.pivot.set(pivotX, pivotY);
            }
            if (type === "9slice") {
                const nineSliceData = childNode;
                const _w = nineSliceData.width;
                const _h = nineSliceData.height;
                const _x = nineSliceData.x || 0;
                const _y = nineSliceData.y || 0;
                const pivotX = nineSliceData.pivotX || 0;
                const pivotY = nineSliceData.pivotY || 0;
                let texName = _name;
                texName = texName.endsWith("_9S")
                    ? texName.slice(0, -3)
                    : texName;
                const nineSlice = new ZNineSlice(this.scene.textures[texName], nineSliceData, this.orientation);
                nineSlice.name = _name;
                mc[texName] = nineSlice;
                mc.addChild(nineSlice);
                this.addToResizeMap(nineSlice);
                nineSlice.x = _x;
                nineSlice.y = _y;
                nineSlice.pivot.set(pivotX, pivotY);
            }
            if (ZScene.isAssetType(type)) {
                const instanceData = childNode;
                if (instanceData.guide)
                    continue;
                const frames = this.getChildrenFrames(childNode.name);
                if (Object.keys(frames).length > 0) {
                    asset = new ZTimeline();
                    asset.setFrames(frames);
                    if (this.data.cuePoints &&
                        this.data.cuePoints[childNode.name]) {
                        asset.setCuePoints(this.data.cuePoints[childNode.name]);
                    }
                }
                else {
                    asset = new (ZScene.getAssetType(type) || ZContainer)();
                }
                asset.name = instanceData.instanceName;
                if (!asset.name) {
                    return;
                }
                mc[asset.name] = asset;
                this.applyFilters(childNode, asset);
                asset.setInstanceData(instanceData, this.orientation);
                mc.addChild(asset);
                this.addToResizeMap(asset);
            }
            if (type === "particle") {
                let particleBasePath = this.assetBasePath;
                if (!particleBasePath.endsWith("/")) {
                    particleBasePath += "/";
                }
                const particleData = childNode;
                const jsonPath = particleBasePath +
                    particleData.jsonPath +
                    `?t=${Date.now()}`;
                const pngPaths = particleBasePath +
                    particleData.pngPaths +
                    `?t=${Date.now()}`;
                PIXI.Assets.load(pngPaths)
                    .then((texture) => {
                    PIXI.Assets.load(jsonPath)
                        .then((pData) => {
                        mc.loadParticle(pData, texture, pData.name);
                    })
                        .catch((err) => {
                        console.error("Failed to load particle data:", err);
                    });
                });
            }
            if (type === "spine") {
                let spineBasePath = this.assetBasePath;
                if (!spineBasePath.endsWith("/")) {
                    spineBasePath += "/";
                }
                const spineData = childNode;
                const zSpine = new ZSpine(spineData, spineBasePath);
                zSpine.load((spine) => {
                    if (spine) {
                        mc.addChild(spine);
                        if (spineData.slotAttachments &&
                            spineData.slotAttachments.length > 0) {
                            for (const attachment of spineData.slotAttachments) {
                                const slotIndex = 
                                // spine-pixi-v8: use findSlot+indexOf (no findSlotIndex)
                                (() => {
                                    const s = spine.skeleton.findSlot(attachment.slotName);
                                    return s ? spine.skeleton.slots.indexOf(s) : -1;
                                })();
                                if (slotIndex < 0)
                                    continue;
                                const slotContainer = spine
                                    .slotContainers?.[slotIndex];
                                if (!slotContainer)
                                    continue;
                                this.addSlotAttachment(attachment.assetData, slotContainer);
                            }
                        }
                    }
                });
            }
            const templates = this.data.templates;
            const childTempObj = templates[childNode.name];
            if (childTempObj && childTempObj.children) {
                if (asset) {
                    this.createAsset(asset, childTempObj);
                }
                else {
                    this.createAsset(mc, childTempObj);
                }
            }
            asset?.init();
        }
    }
    addSlotAttachment(assetData, slotContainer) {
        if (ZScene.isAssetType(assetData.type)) {
            const instanceData = assetData;
            const child = this.spawn(instanceData.name);
            if (child) {
                child.name = instanceData.instanceName;
                child.setInstanceData(instanceData, this.orientation);
                slotContainer.addChild(child);
            }
        }
    }
    applyFilters(obj, tf) {
        if (obj.filters) {
            for (const k in obj.filters) {
                const filter = obj.filters[k];
                if (filter.type === "dropShadow") {
                    const dropShadowFilter = new DropShadowFilter();
                    dropShadowFilter.alpha = filter.alpha;
                    dropShadowFilter.blur = filter.blur;
                    dropShadowFilter.color = filter.color;
                    // pixi-filters v6: distance+rotation replaced by offset
                    const _angle = filter.rotation || 0;
                    const _dist = filter.distance || 4;
                    dropShadowFilter.offset = {
                        x: Math.cos(_angle) * _dist,
                        y: Math.sin(_angle) * _dist,
                    };
                    if (!tf.filters) {
                        tf.filters = [];
                    }
                    tf.filters.push(dropShadowFilter);
                }
                if (filter.type === "blur") {
                    const blurFilter = new PIXI.BlurFilter();
                    blurFilter.blur = filter.blur;
                    if (!tf.filters) {
                        tf.filters = [];
                    }
                    tf.filters.push(blurFilter);
                }
                if (filter.type === "colorMatrix") {
                    const colorMatrixFilter = new PIXI.ColorMatrixFilter();
                    if (filter.matrix) {
                        colorMatrixFilter.matrix = filter.matrix;
                    }
                    if (!tf.filters) {
                        tf.filters = [];
                    }
                    tf.filters.push(colorMatrixFilter);
                }
            }
        }
    }
    async createBitmapTextFromXML(xmlUrl, textToDisplay, fontName, fontSize, callback) {
        const response = await fetch(xmlUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch XML font data: ${response.statusText}`);
        }
        const xmlData = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, "text/xml");
        const pageElement = xmlDoc.querySelector("page");
        if (!pageElement) {
            throw new Error("Page element not found in XML");
        }
        const fileAttribute = pageElement.getAttribute("file");
        if (!fileAttribute) {
            throw new Error("Page file attribute not found in XML");
        }
        const textureUrl = "./../assets/" + fileAttribute;
        this.loadTexture(textureUrl)
            .then((texture) => {
            // PIXI v8: BitmapFont.install takes an options object
            PIXI.BitmapFont.install({
                data: xmlDoc,
                textures: texture,
            });
            if (PIXI.BitmapFont.available?.[fontName]) {
                callback();
            }
        })
            .catch((error) => {
            console.error("Error loading texture:", error);
        });
        return null;
    }
    /** Loads a texture from a given URL using the PIXI v8 asset loader. */
    loadTexture(textureUrl) {
        return PIXI.Assets.load(textureUrl);
    }
}
//# sourceMappingURL=ZScene.js.map