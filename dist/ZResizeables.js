export class ZResizeables {
    static resizeables = new Map();
    /**
     * Registers an object to receive `resize()` calls when the viewport changes.
     * @param mc - Any object that exposes a `resize()` method.
     */
    static addResizeable(mc) {
        ZResizeables.resizeables.set(mc, true);
    }
    /**
     * Calls `resize()` on every registered object.
     * Typically invoked from the application's window `resize` handler.
     */
    static resize() {
        for (const [key] of ZResizeables.resizeables) {
            key.resize();
        }
    }
    /**
     * Unregisters an object so it no longer receives `resize()` calls.
     * @param mc - The object to remove.
     */
    static removeResizeable(mc) {
        ZResizeables.resizeables.delete(mc);
    }
}
//# sourceMappingURL=ZResizeables.js.map