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

    async process<Key extends keyof ActionHandlers>(type: Key, ...handlerParameters: Parameters<ActionHandlers[Key]>): Promise<Unwrap<ReturnType<ActionHandlers[Key]>>> {
        const messageId = `ui-msg-${this.messageIdCount++}`;

        const data = {
            type,
            messageId,
            handlerParameters: handlerParameters,
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


// This allows arbitrary class methods to be called, and means handlers
// can be called as if they were methods on the class
// ie. drahClient.handlerName(...handlerArguments)
export function getRichDrahClient<ActionHandlers extends _ActionHandlers>(...options: ConstructorParameters<typeof DrahClient>) {
    const simpleDrahClient = new DrahClient<ActionHandlers>(...options);
    const typeCoercedSimpleDrahClient = simpleDrahClient as typeof simpleDrahClient & ActionHandlers

    return new Proxy(typeCoercedSimpleDrahClient, {
        get: function(target, property) {
            
            if (property in target) {
                // @ts-ignore
                return target[property]
            }

            function process(...args: any) {
                // @ts-ignore
                return target.process(property, ...args)
            }

            return process

        }
    });
}