/**
 * Shim that re-exports PIXI v8's Sprite as '@pixi/sprite'.
 *
 * @pixi/particle-emitter v5 was written for PIXI v6/v7 and
 * does `class Particle extends sprite.Sprite`.  In PIXI v8 the
 * renderer calls `updateLocalTransform()` on every scene-graph child;
 * the old v6 Sprite prototype is missing that method, causing:
 *   "Uncaught TypeError: e.updateLocalTransform is not a function"
 *
 * By aliasing this module to '@pixi/sprite' (see webpack.config.js),
 * Particle will extend the real PIXI v8 Sprite and will be a first-class
 * member of the v8 scene graph and rendering pipeline.
 */
export { Sprite } from 'pixi.js';
//# sourceMappingURL=pixi-sprite-shim.d.ts.map