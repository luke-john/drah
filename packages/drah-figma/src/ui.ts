import type { _ActionHandlers } from 'drah-shared';
import { getRichDrahClient } from 'drah-client';
import { DrahServer } from 'drah-server';

type Unwrap<T> = T extends Promise<infer U> ? U : T extends (...args: any) => Promise<infer U> ? U : T extends (...args: any) => infer U ? U : T;

export function setupDrahUI<
    MainActionHandlers extends _ActionHandlers, UIActionHandlers extends _ActionHandlers = _ActionHandlers
>(handlers: UIActionHandlers): {
    drahMainClient: {
        [Key in keyof MainActionHandlers]: (...handlerParameters: Parameters<MainActionHandlers[Key]>) => Promise<Unwrap<ReturnType<MainActionHandlers[Key]>>>
    } & {receiveFromServer: (message: string) => void}
} {
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



    return { drahMainClient: drahMainClient as any };
}
