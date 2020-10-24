import { deserializeData, serializeData } from './serialize';

describe('serializeData', () => {
    test('serializeData serializes top level errors', () => {
        const serializedError = serializeData(new Error('test'));

        expect(serializedError.startsWith('{"name":"Error","message":"test","stack":"Error: test')).toBe(true);
    });

    test('serializeData serializes nested Errors', () => {
        const serializedError = serializeData({ error: new Error('test') });
        const expectedResponseStart = '{"error":{"name":"Error","message":"test","stack":"Error: test';

        expect(serializedError.substring(0, expectedResponseStart.length)).toBe(expectedResponseStart);
    });
});

describe('deserializeData', () => {
    test('deserializeData deserializes top level errors', () => {
        const originalError = new Error('test');
        const serializedError = serializeData(originalError);

        const deserializedData = deserializeData(serializedError);

        expect(deserializedData.message).toBe(originalError.message);
        expect(deserializedData.stack).toBe(originalError.stack);
    });

    test('deserializeData deserializes nested Errors', () => {
        const originalError = new Error('test');
        const serializedError = serializeData({ error: originalError });

        const deserializedData = deserializeData(serializedError);

        expect(deserializedData.error.message).toBe(originalError.message);
        expect(deserializedData.error.stack).toBe(originalError.stack);
    });
});
