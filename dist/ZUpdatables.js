export class ZUpdatables {
    static updatables = new Map();
    static fpsInterval = 0;
    static then = 0;
    static now = 0;
    static elapsed = 0;
    static startTime = 0;
    /**
     * Initialises the update loop target frame rate.
     * @param fps - The desired frames per second (e.g. 60).
     */
    static init(fps) {
        this.fpsInterval = 1000 / fps;
        this.then = Date.now();
        this.startTime = this.then;
    }
    /**
     * Registers an object to receive `update()` calls each tick.
     * @param mc - Any object that exposes an `update()` method.
     */
    static addUpdateAble(mc) {
        ZUpdatables.updatables.set(mc, true);
    }
    /**
     * Called every frame (e.g. from a `requestAnimationFrame` loop).
     * Throttles calls to registered updatables according to the configured FPS.
     */
    static update() {
        this.now = Date.now();
        this.elapsed = this.now - this.then;
        if (this.elapsed > this.fpsInterval) {
            this.then = this.now - (this.elapsed % this.fpsInterval);
            for (const [key] of ZUpdatables.updatables) {
                key.update();
            }
        }
    }
    /**
     * Unregisters an object so it no longer receives `update()` calls.
     * @param mc - The object to remove.
     */
    static removeUpdateAble(mc) {
        ZUpdatables.updatables.delete(mc);
    }
}
//# sourceMappingURL=ZUpdatables.js.map