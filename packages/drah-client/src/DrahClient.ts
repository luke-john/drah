import { PubSub, deserializeData, serializeData } from 'drah-shared';
import type { _ActionHandlers } from 'drah-shared';

/**
 * Fires actions that will be processed in another environment.
 *
 * Call its receiveFromServer method with the unserialized
 * data that has been received from an associated ActionProcessor.
 *
 *     const client = new DrahClient({
 *         sendToServer: (serializedData) => {
 *             sendMessageToProcessor(serializedData);
 *         }
 *     })
 *     onMessageFromProcessor((unserializedMessage: string) => {
 *         client.receiveFromServer(unserializedMessage)
 *     })
 */
export class DrahClient<ActionHandlers extends _ActionHandlers> {
    private messageIdCount = 0;
    private pubSub = new PubSub<{ response: any; error: any }>();

    private sendToServer: (serialisedData: string) => void;

    constructor(config: { sendToServer: (serialisedData: string) => void }) {
        this.sendToServer = config.sendToServer;
    }

    public async receiveFromServer(serializedData: string) {
        const { messageId, response, error } = deserializeData(serializedData);

        this.pubSub.publish(`message-handled-${messageId}`, {
            response,
            error,
        });
    }

    async process<Key extends keyof ActionHandlers>(type: Key, options: Parameters<ActionHandlers[Key]>[0]): Promise<Unwrap<ReturnType<ActionHandlers[Key]>>> {
        const messageId = `ui-msg-${this.messageIdCount++}`;

        const data = {
            type,
            messageId,
            options: options,
        };

        const serializedData = serializeData(data);

        const receivedBack = (await new Promise((resolve) => {
            this.sendToServer(serializedData);

            const unsubscribe = this.pubSub.subscribe(`message-handled-${messageId}`, (data) => {
                resolve(data);
                unsubscribe();
            });
        })) as any;

        if (receivedBack.error) {
            throw receivedBack.error;
        }

        return receivedBack.response;
    }
}

type Unwrap<T> = T extends Promise<infer U> ? U : T extends (...args: any) => Promise<infer U> ? U : T extends (...args: any) => infer U ? U : T;
