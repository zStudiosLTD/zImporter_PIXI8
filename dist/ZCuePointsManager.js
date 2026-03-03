export class ZCuePointsManager {
    static cuePoints = new Map();
    /**
     * Registers a callback to be invoked whenever the named cue point is triggered.
     * Multiple callbacks can be registered for the same cue point.
     * @param cuePoint - The name of the cue point to listen for.
     * @param callback - The function to call when the cue point fires.
     */
    static addCuePointListener(cuePoint, callback) {
        if (!this.cuePoints.has(cuePoint)) {
            this.cuePoints.set(cuePoint, []);
        }
        this.cuePoints.get(cuePoint)?.push(callback);
    }
    /**
     * Removes a previously registered callback for the named cue point.
     * If the callback is not found, the call is a no-op.
     * @param cuePoint - The name of the cue point.
     * @param callback - The exact function reference passed to `addCuePointListener`.
     */
    static removeCuePointListener(cuePoint, callback) {
        if (this.cuePoints.has(cuePoint)) {
            const callbacks = this.cuePoints.get(cuePoint);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                }
            }
        }
    }
    /**
     * Fires all callbacks registered for the named cue point, forwarding any
     * extra arguments (e.g. the originating `ZTimeline`) to each one.
     * @param cuePoint - The name of the cue point to trigger.
     * @param args - Additional arguments forwarded to every registered callback.
     */
    static triggerCuePoint(cuePoint, ...args) {
        if (this.cuePoints.has(cuePoint)) {
            const callbacks = this.cuePoints.get(cuePoint);
            if (callbacks) {
                for (const callback of callbacks) {
                    callback(...args);
                }
            }
        }
    }
}
//# sourceMappingURL=ZCuePointsManager.js.map