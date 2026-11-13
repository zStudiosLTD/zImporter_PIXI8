# zImporter

The `zImporter` is a TypeScript package designed to import and manage graphical hierarchies created in **zStudio**. This package allows seamless integration of assets and scenes built in **zStudio** into your JavaScript or TypeScript-based projects, particularly those using **PixiJS**.

## Features

* Import and manage scenes and graphical hierarchies from **zStudio**
* Works with **PixiJS** to display and interact with imported assets
* Provides a flexible and easy-to-use API for handling assets and scenes.

* Download zStudios to get started: https://zstudiosltd.com/

## Community & Support

Questions, bug reports or something to show off? Join the zImporter channel on the zStudio Discord: https://discord.com/channels/1570547074414547094/1570777267804835931

## Installation

To install the `zImporter` package from the npm registry:

```bash
npm install zimporter-pixi@1.0.10
```

Or to always get the latest version:

```bash
npm install zimporter-pixi@latest
```

> **Note:** Your `tsconfig.json` should include:

```json
"module": "ESNext",
"moduleResolution": "bundler"
```

## Building
npm run package

## Usage

### Importing zImporter into Your Project

You can find an example project here:
https://github.com/zStudiosLTD/zImporter_PIXI_Example

Basic import:

```ts
import { ZTimeline } from 'zimporter-pixi';
```

### Example: Creating a New PixiJS Application

```ts
import * as PIXI from 'pixi.js';
import { Game } from './Game';
import { ZSceneStack, ZUpdatables } from 'zimporter-pixi';

const app = new PIXI.Application({
  backgroundColor: 0x000000,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true,
});

function resizeCanvas() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  ZSceneStack.resize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resizeCanvas);

const game = new Game(app.stage, resizeCanvas);
document.body.appendChild(app.view as any);
ZUpdatables.init(24);

let lastTime = performance.now();
let frameCount = 0;

app.ticker.add(() => {
  frameCount++;
  const now = performance.now();
  const delta = now - lastTime;

  if (delta >= 1000) {
    frameCount = 0;
    lastTime = now;
  }

  const deltaMS = PIXI.Ticker.shared.deltaMS / 1000;
  game.update(deltaMS);
  ZUpdatables.update();
});
```

> This sets up a Pixi renderer and integrates zImporter’s update system.

### Example: Loading and Displaying a Scene from zStudio

```ts
import * as PIXI from 'pixi.js';
import { ZScene, ZSceneStack, ZTimeline } from 'zimporter-pixi';

let scene = new ZScene();
scene.load('./assets/robo/', () => {
  ZSceneStack.push(scene);
  const mc = ZSceneStack.spawn('RobotWalker') as ZTimeline;
  mc.play();
  stage.addChild(mc);
  mc.x = 100;
  mc.y = 200;
});
```

### Example: Loading a Stage Created in zStudio

```ts
import * as PIXI from 'pixi.js';
import { ZScene, ZSceneStack } from 'zimporter-pixi';

constructor(stage: PIXI.Container) {
  this.stage = stage;
  const loadPath = (window as any).loadPath;
  const scene = new ZScene('testScene');
  scene.load(loadPath, () => {
    ZSceneStack.push(scene);
    scene.loadStage(this.stage);
  });
}
```

> Each `ZScene` has a stage associated with it. This preserves the position and orientation logic defined in **zStudio**. Always add the scene stage to the root container.

## API

The package exposes several classes and methods for interacting with imported assets:

### `ZScene`

* Container for your entire scene.
* Handles screen resizing.
* Allows spawning of assets or loading full stages.

### `ZContainer`

* Core class for all visual elements.
* Extends `PIXI.Container` and adds:

  * Anchoring support
  * Orientation data from zStudio
* Set `.resizeable = false` to disable responsive behavior.

#### `Working with Text`
  In ZStudio, texts are always wrapper in a container, and are called "label" by default.
  If you know a specific container holds a text fields, you can acces it via:
  `getTextField():PIXI.Text | null`
  You can also set a string on the text via the container using:
  `setText(text:string):void`

#### `Transform Properties and Orientation`

Every element stores a `portrait` and a `landscape` transform, and every resize re-applies the one for the current orientation. Anything not in the stored transform is undone at the next resize.

```ts
mc.x = 100;              // stored for the current orientation
mc.scaleX = 1.5;         // stored for the current orientation (mc.scale.x is NOT stored)
mc.rotation = 0.3;       // stored for both orientations
mc.setVisible(false);    // stored for both orientations (mc.visible = false is NOT stored)
mc.setAlpha(0.5);        // stored for both orientations (mc.alpha = 0.5 is NOT stored)

// Move it for good, with a position for each orientation
mc.portrait.x = 120;
mc.landscape.x = 40;
mc.applyTransform();

// Your code owns the position (player, projectile)
mc.resizeable = false;
```

Full guide: https://zstudiosltd.com/z-importer/guide/responsive

#### `Working with Spine`

Spine objects loaded through zStudio are wrapped in a `ZContainer`. To access the underlying Spine instance use `getSpine()`:

```ts
import { ZContainer } from 'zimporter-pixi';

const spineContainer = ZSceneStack.spawn('MySpineAsset') as ZContainer;
stage.addChild(spineContainer);

const spineObj = spineContainer.getSpine() as PIXISpine3.Spine | PIXISpine4.Spine | undefined; // Spine 3.8 | Spine 4.0 | undefined

if (spineObj) {
  spineObj.state.setAnimation(0, 'idle', true);
  spineObj.state.addAnimation(0, 'walk', true, 0);
}
```

Once you have the `Spine` reference you can interact with it exactly as you would with any regular pixi-spine object — set animations, attach listeners, adjust skin, etc.

### `ZButton`

* Extends `ZContainer`.
* Has `.enable()` / `.disable()` methods.
* Supports child containers with special names:

  * `upState`, `downState`, `overState`, `disabledState`, `labelContainer`

> When these are defined in **zStudio**, the button works automatically.

### `ZTimeline`

* Extends `ZContainer`.
* Manages frame-based timeline animations.
* API includes:

  * `.play()`, `.stop()`
  * `.gotoAndPlay(frameNum)`, `.gotoAndStop(frameNum)`
  * `.addStateEndEventListener(cb)`, `.removeStateEndEventListener(cb)`

### `ZState`

* Extends `ZContainer`.
* Only one child is visible at a time.
* Use `.setState(name: string)` to switch visible content.
* Can contain nested `ZTimeline` objects.


## AI skills

The [`skills/`](./skills) folder has short guides that teach an AI tool to use this package correctly: setup, components, responsive layout, animation and spawning. Add the folder in zStudio under **Help → AI Skill Libraries**, or point your AI tool at `node_modules/zimporter-pixi8/skills/`.

Usage guide with examples: https://zstudiosltd.com/z-importer/guide

## Contributing

We welcome contributions!
To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request.

Please follow the existing code style and add tests where relevant.

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.
