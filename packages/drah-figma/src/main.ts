import type { _ActionHandlers } from 'drah-shared';
import { getRichDrahClient } from 'drah-client';
import { DrahServer } from 'drah-server';

type Unwrap<T> = T extends Promise<infer U> ? U : T extends (...args: any) => Promise<infer U> ? U : T extends (...args: any) => infer U ? U : T;

export function setupDrahMain<
    UIActionHandlers extends _ActionHandlers, MainActionHandlers extends _ActionHandlers = _ActionHandlers
>(handlers: MainActionHandlers): {
    drahUiClient: {
        [Key in keyof UIActionHandlers]: (...handlerParameters: Parameters<UIActionHandlers[Key]>) => Promise<Unwrap<ReturnType<UIActionHandlers[Key]>>>
    } & {receiveFromServer: (message: string) => void}
} {
    const drahUiClient = getRichDrahClient<UIActionHandlers>({
        sendToServer: (serializedData) => {
            figma.ui.postMessage({
                type: 'from-ui-drah-client',
                data: serializedData,
            });
        },
    });

    const drahMainServer = new DrahServer({
        handlers,
        sendToClient: (message: string) => {
            figma.ui.postMessage({
                type: 'from-main-drah-server',
                data: message,
            });
        },
    });

    figma.ui.onmessage = async function handleMessage(pluginMessage) {
        if (pluginMessage.type === 'from-ui-drah-server') {
            drahUiClient.receiveFromServer(pluginMessage.data);
            return;
        }
        if (pluginMessage.type === 'from-main-drah-client') {
            drahMainServer.receiveFromClient(pluginMessage.data);
            return;
        }
    };

    // type DrahUiClient = Omit<typeof drahUiClient, 'receiveFromServer' | 'process'>;

    return { drahUiClient: drahUiClient as any };
}
