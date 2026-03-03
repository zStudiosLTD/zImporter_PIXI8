export declare class ZResizeables {
    static resizeables: Map<any, boolean>;
    /**
     * Registers an object to receive `resize()` calls when the viewport changes.
     * @param mc - Any object that exposes a `resize()` method.
     */
    static addResizeable(mc: any): void;
    /**
     * Calls `resize()` on every registered object.
     * Typically invoked from the application's window `resize` handler.
     */
    static resize(): void;
    /**
     * Unregisters an object so it no longer receives `resize()` calls.
     * @param mc - The object to remove.
     */
    static removeResizeable(mc: any): void;
}
//# sourceMappingURL=ZResizeables.d.ts.map