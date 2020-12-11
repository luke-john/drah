import { serializeError, deserializeError } from 'serialize-error';

export { serializeError, deserializeError };

export function serializeData(data: any) {
    const serializedData = JSON.stringify(data, (_key, value) => {
        if (value instanceof Error) {
            return serializeError(value);
        }

        return value;
    });

    return serializedData;
}

export function deserializeData(data: string) {
    const deserializedData = JSON.parse(data, (_key, value) => {
        // probably an error which has been serialized
        if (value && value.name === 'Error' && value.stack !== undefined) {
            return deserializeError(value);
        }

        return value;
    });

    return deserializedData;
}
