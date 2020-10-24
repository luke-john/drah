import { DrahServer } from './DrahServer';
import { serializeData } from 'drah-shared/build/serialize';

describe('DrahServer', () => {
    test('Processes actions it receives from a client with handler and responds with a success on completion', async () => {
        const processedActions: string[] = [];

        const server = new DrahServer<{ fake: (option: string) => { option: string; result: string } }>({
            handlers: {
                fake: (option: string) => ({ option, result: 'processed data' }),
            },
            sendToClient: (data) => processedActions.push(data),
        });

        const fakeClientAction = serializeData({
            messageId: 'fake-message-id',
            type: 'fake',
            options: 'data-to-process',
        });

        await server.receiveFromClient(fakeClientAction);

        expect(processedActions[0]).toBe('{"messageId":"fake-message-id","response":{"option":"data-to-process","result":"processed data"}}');
    });

    test('Processes actions it receives from a client with handler and responds with a error if the handler throws', async () => {
        const processedActions: string[] = [];

        const server = new DrahServer<{ fake: (option: string) => any }>({
            handlers: {
                fake: () => {
                    throw new Error('failed to process data');
                },
            },
            sendToClient: (data) => processedActions.push(data),
        });

        const fakeClientAction = serializeData({
            messageId: 'fake-message-id',
            type: 'fake',
            options: 'data-to-process',
        });

        await server.receiveFromClient(fakeClientAction);

        const expectedResponseStart = '{"messageId":"fake-message-id","error":{"name":"Error","message":"failed to process data","stack":"Error';

        expect(processedActions[0].substring(0, expectedResponseStart.length)).toBe(expectedResponseStart);
    });
});
