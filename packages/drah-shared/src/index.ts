export { deserializeData, serializeData, deserializeError, serializeError } from './serialize';

export { PubSub } from './PubSub';

export type Action = { type: string; options: any; response: any };
export type _ActionHandlers<Key extends string = string> = {
    [type in Key]: (options?: any) => any | Promise<any> | void;
};
