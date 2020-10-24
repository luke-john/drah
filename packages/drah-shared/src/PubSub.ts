type Unsubscribe = () => void;

export class PubSub<Data> {
    subscribers: {
        [eventKey: string]: ((data: Data) => void)[];
    } = {};

    subscribe(event: string, callback: (data: Data) => void): Unsubscribe {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }

        this.subscribers[event].push(callback);

        return () => {
            this.subscribers[event] = this.subscribers[event].filter((subscriber) => subscriber !== callback);
        };
    }

    publish(event: string, data: Data) {
        if (!this.subscribers[event]) return;

        this.subscribers[event].forEach((cb) => cb(data));
    }
}
