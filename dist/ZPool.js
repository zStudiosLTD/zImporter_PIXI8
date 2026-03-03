import { ZSceneStack } from "./ZSceneStack";
export class ZPool {
    dict = {};
    static instance = new ZPool();
    constructor() {
        if (ZPool.instance) {
            throw new Error("Singleton and can only be accessed through Singleton.getInstance()");
        }
    }
    /**
     * Returns the singleton `ZPool` instance.
     */
    static getInstance() {
        return ZPool.instance;
    }
    /**
     * Creates and pre-populates a named pool by spawning `_numElements` copies of
     * `symbolTemplate` from the `ZSceneStack`.
     * @param _numElements - Number of objects to pre-allocate.
     * @param symbolTemplate - The template/asset name used to spawn each object.
     * @param type - A string key that identifies this pool.
     */
    init(_numElements, symbolTemplate, type) {
        this.dict[type] = {
            curIndex: 0,
            numElements: _numElements,
            CLS: symbolTemplate,
            pool: new Array(_numElements)
        };
        const pool = this.dict[type].pool;
        for (let i = 0; i < _numElements; i++) {
            pool[i] = ZSceneStack.spawn(symbolTemplate);
        }
    }
    /**
     * Resets the pool cursor to zero, effectively marking all objects as available
     * again without destroying them.
     * @param type - The pool key to reset.
     */
    clear(type) {
        if (this.dict[type]) {
            const obj = this.dict[type];
            obj.curIndex = 0;
        }
        else {
            throw new Error(`pool ${type} does not exist in pool`);
        }
    }
    /**
     * Retrieves the next available object from the pool and advances the cursor.
     * @param type - The pool key to retrieve from.
     */
    get(type) {
        if (this.dict[type]) {
            const obj = this.dict[type];
            const pool = obj.pool;
            const e = pool[obj.curIndex];
            if (e === null || e === undefined) {
                throw new Error(`pool ${type} limit exceeded ${obj.curIndex}`);
            }
            if (obj.fnctn) {
                obj.fnctn(e);
            }
            obj.curIndex++;
            return e;
        }
        else {
            throw new Error(`pool ${type} does not exist in pool`);
        }
    }
    /**
     * Returns an object to the pool, decrementing the cursor.
     * @param e - The object to return.
     * @param type - The pool key it belongs to.
     */
    putBack(e, type) {
        if (this.dict[type]) {
            const obj = this.dict[type];
            const pool = obj.pool;
            obj.curIndex--;
            pool[obj.curIndex] = e;
        }
        else {
            throw new Error(`pool ${type} does not exist in pool`);
        }
    }
}
//# sourceMappingURL=ZPool.js.map