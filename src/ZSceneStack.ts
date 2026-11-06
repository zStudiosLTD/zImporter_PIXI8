import { ZContainer } from "./ZContainer";
import { ZScene } from "./ZScene";

/**
 * Manages a stack of `ZScene` instances, providing static methods to
 * push, pop, peek, spawn from, and resize all scenes in the stack.
 */
export class ZSceneStack {
    private static stack: ZScene[] = [];
    private static stackSize: number = 0;
    private static top: number = 0;

    public static push(resource: ZScene): void {
        this.stack[this.top] = resource;
        this.top++;
        this.stackSize++;
    }

    public static pop(): ZScene | null {
        if (this.stackSize > 0) {
            this.top--;
            this.stackSize--;
            const scene = this.stack[this.top];
            // Drop the slot so a popped scene no longer receives resize or spawn calls.
            this.stack.length = this.top;
            return scene;
        }
        return null;
    }

    public static peek(): ZScene | null {
        if (this.stackSize > 0) {
            return this.stack[this.top - 1];
        }
        return null;
    }

    public static getStackSize(): number {
        return this.stackSize;
    }

    public static clear(): void {
        this.stack = [];
        this.stackSize = 0;
        this.top = 0;
    }

    /**
     * Searches the stack from top to bottom and calls `spawn(templateName)` on
     * each scene until one returns a container instance.
     */
    static spawn(templateName: string): ZContainer | undefined {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            let gameScene: ZScene = this.stack[i];
            let ent: ZContainer | undefined = gameScene.spawn(templateName);
            if (ent) {
                return ent;
            }
        }
    }

    static resize(width: number, height: number): void {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            let gameScene: ZScene = this.stack[i];
            gameScene.resize(width, height);
        }
    }
}
