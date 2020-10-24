import { DrahClient } from '../packages/drah-client/src/DrahClient';
import { DrahServer } from '../packages/drah-server/src/DrahServer';

describe('drah client and server', () => {
    const environmentConnectors: {
        sendToServer?: (data: string) => void;
        respondToClient?: (data: string) => void;
    } = {
        sendToServer: undefined,
        respondToClient: undefined,
    };

    const testError = new Error('failure');

    const handlers = {
        doubleSync: (count: number) => count * 2,
        doubleAsync: async (count: number) => {
            await new Promise((resolve) => resolve());
            return count * 2;
        },
        failSync: (options: undefined) => {
            throw testError;
        },
        failAsync: async (options: undefined) => {
            await new Promise((resolve) => resolve());
            throw testError;
        },
    };
    const processor = new DrahServer({
        handlers,
        sendToClient: (serializedData) => {
            environmentConnectors.respondToClient!(serializedData);
        },
    });
    const client = new DrahClient<typeof handlers>({
        sendToServer: (serializedData) => {
            environmentConnectors.sendToServer!(serializedData);
        },
    });

    environmentConnectors.sendToServer = (data) => {
        processor.receiveFromClient(data);
    };

    environmentConnectors.respondToClient = (data) => {
        client.receiveFromServer(data);
    };

    test('Client receives a "sync" processor handlers response', async () => {
        const result = await client.process('doubleSync', 21);

        expect(result).toBe(42);
    });

    test('Client receives an "async" processor handlers response', async () => {
        const result = await client.process('doubleAsync', 21);

        expect(result).toBe(42);
    });

    test('Client throws an when a "sync" processor handler throws', async () => {
        expect(client.process('failSync', undefined)).rejects.toThrow(testError.message);
    });

    test('Client throws an when an "async" processor handler throws', async () => {
        expect(client.process('failAsync', undefined)).rejects.toThrow(testError.message);
    });
});
