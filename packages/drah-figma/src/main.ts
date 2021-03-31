import type { _ActionHandlers } from 'drah-shared';
import { getRichDrahClient } from 'drah-client';
import { DrahServer } from 'drah-server';

export function setupDrahMain<
    UIActionHandlers extends _ActionHandlers, MainActionHandlers extends _ActionHandlers = _ActionHandlers
>(handlers: MainActionHandlers) {
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

    type DrahUiClient = Omit<typeof drahUiClient, 'receiveFromServer'>;

    return drahUiClient as DrahUiClient;
}
