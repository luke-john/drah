import { DrahServer } from './DrahServer';
import { serializeData } from 'drah-shared/build/serialize';

describe('DrahServer', () => {
    test('Processes actions it receives from a client with handler and responds with a success on completion', async () => {
        const receivedActionsOptions: string[] = [];
        const processedActions: string[] = [];

        const server = new DrahServer<{ fake: (option: string) => { option: string; result: string } }>({
            handlers: {
                fake: (option: string) => {
                    receivedActionsOptions.push(option);
                    return { option, result: 'processed data' };
                },
            },
            sendToClient: (data) => processedActions.push(data),
        });

        const fakeClientAction = serializeData({
            messageId: 'fake-message-id',
            type: 'fake',
            handlerParameters: ['data-to-process'],
        });

        await server.receiveFromClient(fakeClientAction);

        expect(receivedActionsOptions[0]).toBe('data-to-process');
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
            handlerParameters: ['data-to-process'],
        });

        await server.receiveFromClient(fakeClientAction);

        const expectedResponseStart = '{"messageId":"fake-message-id","error":{"name":"Error","message":"failed to process data","stack":"Error';

        expect(processedActions[0].substring(0, expectedResponseStart.length)).toBe(expectedResponseStart);
    });

    test('Processes actions that have multiple arguments it receives from a client with handler and responds with a success on completion', async () => {
        const receivedActionsOptions: Array<string[]> = [];
        const processedActions: string[] = [];

        const server = new DrahServer<{ fake: (...options: string[]) => { options: string[]; result: string } }>({
            handlers: {
                fake: (...options: string[]) => {
                    receivedActionsOptions.push(options);
                    return { options, result: 'processed data' };
                },
            },
            sendToClient: (data) => processedActions.push(data),
        });

        const fakeClientAction = serializeData({
            messageId: 'fake-message-id',
            type: 'fake',
            handlerParameters: ['data-to-process-one', 'data-to-process-two'],
        });

        await server.receiveFromClient(fakeClientAction);

        expect(receivedActionsOptions[0]).toMatchObject(['data-to-process-one', 'data-to-process-two']);
        expect(processedActions[0]).toBe('{"messageId":"fake-message-id","response":{"options":["data-to-process-one","data-to-process-two"],"result":"processed data"}}');
    });

    test('Processes actions that have multiple arguments it receives from a client with handler and responds with a error if the handler throws', async () => {
        const processedActions: string[] = [];

        const server = new DrahServer<{ fake: (...options: string[]) => any }>({
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
            handlerParameters: ['data-to-process', 'data-tw-'],
        });

        await server.receiveFromClient(fakeClientAction);

        const expectedResponseStart = '{"messageId":"fake-message-id","error":{"name":"Error","message":"failed to process data","stack":"Error';

        expect(processedActions[0].substring(0, expectedResponseStart.length)).toBe(expectedResponseStart);
    });
});
