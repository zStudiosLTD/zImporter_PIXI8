export declare class ZPool {
    private dict;
    private static instance;
    private constructor();
    /**
     * Returns the singleton `ZPool` instance.
     */
    static getInstance(): ZPool;
    /**
     * Creates and pre-populates a named pool by spawning `_numElements` copies of
     * `symbolTemplate` from the `ZSceneStack`.
     * @param _numElements - Number of objects to pre-allocate.
     * @param symbolTemplate - The template/asset name used to spawn each object.
     * @param type - A string key that identifies this pool.
     */
    init(_numElements: number, symbolTemplate: string, type: string): void;
    /**
     * Resets the pool cursor to zero, effectively marking all objects as available
     * again without destroying them.
     * @param type - The pool key to reset.
     */
    clear(type: string): void;
    /**
     * Retrieves the next available object from the pool and advances the cursor.
     * @param type - The pool key to retrieve from.
     */
    get(type: string): any;
    /**
     * Returns an object to the pool, decrementing the cursor.
     * @param e - The object to return.
     * @param type - The pool key it belongs to.
     */
    putBack(e: any, type: string): void;
}
//# sourceMappingURL=ZPool.d.ts.map