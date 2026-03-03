import { ZContainer } from "./ZContainer";
import { ZScene } from "./ZScene";
/**
 * Manages a stack of `ZScene` instances, providing static methods to
 * push, pop, peek, spawn from, and resize all scenes in the stack.
 */
export declare class ZSceneStack {
    private static stack;
    private static stackSize;
    private static top;
    static push(resource: ZScene): void;
    static pop(): ZScene | null;
    static peek(): ZScene | null;
    static getStackSize(): number;
    static clear(): void;
    /**
     * Searches the stack from top to bottom and calls `spawn(templateName)` on
     * each scene until one returns a container instance.
     */
    static spawn(templateName: string): ZContainer | undefined;
    static resize(width: number, height: number): void;
}
//# sourceMappingURL=ZSceneStack.d.ts.map