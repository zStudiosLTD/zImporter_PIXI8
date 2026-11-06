---
name: zimporter-animation-and-spawning
description: Control zStudio timelines, cue points and Spine, and spawn templates at runtime with zimporter-pixi8 (Pixi.js 8). Load before playing animations or creating objects from code.
---
# Animation and spawning (Pixi.js 8)

## Timelines
Containers animated in zStudio become `ZTimeline`. They play once on load by default. Requires `ZUpdatables.update()` every frame.
```ts
const t = stage.get('intro') as ZTimeline;
t.stop(); t.play(); t.gotoAndPlay(0); t.gotoAndStop(12);
t.looping = true;
t.currentFrame; t.totalFrames;

t.addStateEndEventListener(() => {});   // on a looping timeline, runs every loop
t.removeStateEndEventListener();
```

## Cue points
Add in zStudio, then listen by name. Listeners are global across timelines.
```ts
const onHit = (timeline: ZTimeline) => {};
ZCuePointsManager.addCuePointListener('hit', onHit);
ZCuePointsManager.removeCuePointListener('hit', onHit);  // same function reference
```

## Spine
```ts
const spine = (stage.get('hero') as ZContainer).getSpine();
if (spine) spine.state.setAnimation(0, 'idle', true);
```

## Spawning templates
```ts
const coin = ZSceneStack.spawn('Coin') as ZContainer;  // newest scene first. Or scene.spawn('Coin').
coin.x = 300; coin.y = 150;
scene.sceneStage.addChild(coin);                     // not on screen until added
coin.removeFromParent(); coin.destroy({ children: true });
```
A spawned object has no stored layout: resizing never moves it, but it scales with the stage. Children inside it still follow their stored transforms. See `zimporter-responsive-layout`.
