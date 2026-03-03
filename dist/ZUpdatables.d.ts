export declare class ZUpdatables {
    static updatables: Map<any, boolean>;
    static fpsInterval: number;
    static then: number;
    static now: number;
    static elapsed: number;
    static startTime: number;
    /**
     * Initialises the update loop target frame rate.
     * @param fps - The desired frames per second (e.g. 60).
     */
    static init(fps: number): void;
    /**
     * Registers an object to receive `update()` calls each tick.
     * @param mc - Any object that exposes an `update()` method.
     */
    static addUpdateAble(mc: any): void;
    /**
     * Called every frame (e.g. from a `requestAnimationFrame` loop).
     * Throttles calls to registered updatables according to the configured FPS.
     */
    static update(): void;
    /**
     * Unregisters an object so it no longer receives `update()` calls.
     * @param mc - The object to remove.
     */
    static removeUpdateAble(mc: any): void;
}
//# sourceMappingURL=ZUpdatables.d.ts.map