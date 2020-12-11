import { deserializeData, serializeData, serializeError } from 'drah-shared';
import type { _ActionHandlers } from 'drah-shared';

export type ExtractActionsFromServer<Type> = Type extends DrahServer<infer X> ? X : never;

/**
 * Processes functions that have been fired in another environment.
 *
 * Call its receiveFromClient method with the unserialized
 * data that has been received from an associated DrahClient.
 *
 *     const server = new DrahServer({
 *         handlers: { 'foo': (options: { bar: string }) => 42 },
 *         sendToClient: (serializedData) => sendMessageToClient(serializedData);
 *     });
 *     onMessageFromClient((serializedData: string) => {
 *         server.receiveFromClient(serializedData)
 *     })
 */
export class DrahServer<ActionHandlers extends _ActionHandlers> {
    private handlers: ActionHandlers;
    private sendToClient: (serialisedData: string) => void;

    constructor(config: { handlers: ActionHandlers; sendToClient: (serializedData: string) => void }) {
        this.handlers = config.handlers;
        this.sendToClient = config.sendToClient;
    }

    async receiveFromClient(serialisedData: string) {
        try {

            const { type, messageId, handlerParameters = [] } = deserializeData(serialisedData);
            
            try {
                // if the handler is not an async function,
                // calling it in Promise.resolve will result in the error being resolved
                const handlerOutcome = this.handlers[type](...handlerParameters);
                
                const response = await Promise.resolve(handlerOutcome);
                
                const serializedResponse = serializeData({ messageId, response });
                
                this.sendToClient(serializedResponse);
            } catch (error) {
                // if the handler was not an async function, then this will be hit immediately.
                // this causes issues for tests, but could also cause issues for clients who assume
                // processing is always an asyncronous operation
                await new Promise<void>((resolve) => resolve());
                const serializedErrorResponse = serializeData({ messageId, error: serializeError(error) });
                
                this.sendToClient(serializedErrorResponse);
            }
        } catch (err) {
            console.error("failed to deserialize data", err)
        }
    }
}
