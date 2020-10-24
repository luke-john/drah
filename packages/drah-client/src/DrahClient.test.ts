import { DrahClient } from './DrahClient';
import { deserializeData, serializeData } from 'drah-shared';

describe('ActionClient', () => {
    test('DrahClient actions it sends to a processor that return succesfully', async () => {
        const processorActions: string[] = [];

        const client = new DrahClient<{ fake: (options: string) => string }>({
            sendToServer: (data) => processorActions.push(data),
        });

        const [processed] = await Promise.all([
            client.process('fake', 'data-to-process'),
            (async () => {
                const actionForProcessing = deserializeData(processorActions[0]);

                const fakeServerResponse = serializeData({
                    messageId: actionForProcessing.messageId,
                    response: 'processed data',
                });

                client.receiveFromServer(fakeServerResponse);
            })(),
        ]);

        expect(processed).toBe('processed data');
    });

    test('throws actions it sends to a processor that return with an error', async () => {
        const processorActions: string[] = [];

        const client = new DrahClient<{ fake: (options: string) => string }>({
            sendToServer: (data) => processorActions.push(data),
        });

        const error = new Error('failed to process');
        expect(
            Promise.all([
                client.process('fake', 'data-to-process'),
                (async () => {
                    const actionForProcessing = deserializeData(processorActions[0]);

                    const fakeServerResponse = serializeData({
                        messageId: actionForProcessing.messageId,
                        error,
                    });

                    client.receiveFromServer(fakeServerResponse);
                })(),
            ])
        ).rejects.toThrow(error.message);
    });
});
