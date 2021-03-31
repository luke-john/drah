import type { _ActionHandlers } from 'drah-shared';
import { getRichDrahClient } from 'drah-client';
import { DrahServer } from 'drah-server';

export function setupDrahUi<
    MainActionHandlers extends _ActionHandlers, UIActionHandlers extends _ActionHandlers = _ActionHandlers
>(handlers: UIActionHandlers) {
    const drahMainClient = getRichDrahClient<MainActionHandlers>({
        sendToServer: (serializedData) => {
            window.parent.postMessage(
                {
                    pluginMessage: {
                        type: 'from-main-drah-client',
                        data: serializedData,
                    },
                },
                '*'
            );
        },
    });

    const draUIServer = new DrahServer({
        handlers,
        sendToClient: (message: string) => {
            window.parent.postMessage(
                {
                    pluginMessage: {
                        type: 'from-ui-drah-server',
                        data: message,
                    },
                },
                '*'
            )
        },
    });

    window.onmessage = async (event: MessageEvent<any>) => {
        const pluginMessage = event.data.pluginMessage;

        switch (pluginMessage.type) {
            case 'from-main-drah-server':
                drahMainClient.receiveFromServer(pluginMessage.data);

                return;
            case 'from-ui-drah-client':
                draUIServer.receiveFromClient(pluginMessage.data);
        }
    };

    type DrahMainClient = Omit<typeof drahMainClient, 'receiveFromServer'>;

    return drahMainClient as DrahMainClient;
}
