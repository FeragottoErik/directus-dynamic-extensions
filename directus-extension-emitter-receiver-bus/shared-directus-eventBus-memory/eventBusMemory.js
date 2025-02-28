class EventEmitterWithHistory {
    constructor() {
        this.events = new Map();
        this.lastMessages = new Map(); // Store last messages per event
    }

    emit(event, message) {
        this.lastMessages.set(event, message); // Store the last emitted message for this event
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => callback(message));
        }
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);

        // Immediately trigger callback if an event has a stored message
        if (this.lastMessages.has(event)) {
            callback(this.lastMessages.get(event));
        }
    }

    getLastValue(message) {
        return this.lastMessages.get(message);
    }

    off(event, callback) {
        if (this.events.has(event)) {
            this.events.set(event, this.events.get(event).filter(cb => cb !== callback));
            if (this.events.get(event).length === 0) {
                this.events.delete(event);
            }
        }
    }

    clear() {
        this.events.clear();
        this.lastMessages.clear();
    }
}

// Create a **single instance** that will be shared
const eventBusWithMemory = new EventEmitterWithHistory();

export default eventBusWithMemory;