export declare class ZCuePointsManager {
    private static cuePoints;
    /**
     * Registers a callback to be invoked whenever the named cue point is triggered.
     * Multiple callbacks can be registered for the same cue point.
     * @param cuePoint - The name of the cue point to listen for.
     * @param callback - The function to call when the cue point fires.
     */
    static addCuePointListener(cuePoint: string, callback: Function): void;
    /**
     * Removes a previously registered callback for the named cue point.
     * If the callback is not found, the call is a no-op.
     * @param cuePoint - The name of the cue point.
     * @param callback - The exact function reference that was passed to `addCuePointListener`.
     */
    static removeCuePointListener(cuePoint: string, callback: Function): void;
    /**
     * Fires all callbacks registered for the named cue point, forwarding any
     * extra arguments (e.g. the originating `ZTimeline`) to each one.
     * @param cuePoint - The name of the cue point to trigger.
     * @param args - Additional arguments forwarded to every registered callback.
     */
    static triggerCuePoint(cuePoint: string, ...args: any[]): void;
}
//# sourceMappingURL=ZCuePointsManager.d.ts.map