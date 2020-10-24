import { PubSub } from './PubSub';

describe('PubSub', () => {
    test('Sets up subscriptions', () => {
        const pubSub = new PubSub();

        let publishedData: unknown[] = [];

        const subscription: Parameters<typeof pubSub.subscribe> = [
            'test',
            (data) => {
                publishedData.push(data);
            },
        ];

        pubSub.subscribe(...subscription);

        expect(pubSub.subscribers[subscription[0]]).toContain(subscription[1]);
    });

    test('Publishes data', () => {
        type Data = { messageId: string };
        const pubSub = new PubSub<Data>();

        let publishedData: Data[] = [];

        const testEventKey = 'test-event-key';

        const subscription: Parameters<typeof pubSub.subscribe> = [
            testEventKey,
            (data) => {
                publishedData.push(data);
            },
        ];

        pubSub.subscribe(...subscription);

        const eventAndData = [testEventKey, { messageId: 'fake' }] as const;

        pubSub.publish(...eventAndData);

        expect(publishedData).toContain(eventAndData[1]);
    });

    test('Cleans up subscription when unsubscribed', () => {
        type Data = { messageId: string };
        const pubSub = new PubSub<Data>();

        let publishedData: Data[] = [];

        const testEventKey = 'test-event-key';

        const subscription: Parameters<typeof pubSub.subscribe> = [
            testEventKey,
            (data) => {
                publishedData.push(data);
            },
        ];

        const unsubscribe = pubSub.subscribe(...subscription);

        const eventAndData = [testEventKey, { messageId: 'fake' }] as const;

        pubSub.publish(...eventAndData);

        unsubscribe();

        pubSub.publish(...eventAndData);

        expect(publishedData).toHaveLength(1);
    });
});
