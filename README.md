# drah-project

drah allows you to write functions that are run in another environment with minimal setup.

## Packages

-   [drah-client](#drah-client): package which provides the mechanism to run functions on the server.
-   [drah-server](#drah-server): package which runs functions on the server in response to client calls.

## Setting up a drah-server and drah-client

To setup a new action service, you need to do some setup on both the processor and client

### drah-server

The **server environment** requires:

1. A `DrahServer` setup with:

    - handlers for actions you want to provide to clients (via constructor option `handlers`)
    - a mechanism to send responses back to the client (via constructor option `sendToClient`)

2. The `DrahServer` configured to receive requests from the client (via class method `receiveFromClient`)

#### Example

note: this example contains the following two placeholder functions that you need to implement.

-   sendMessageToClient: function which sends messsages to the client environment
-   onMessagefromClient: subscription which fires it's callback on messages from a client environment

```ts
import { DrahServer } from 'drah-server';

const drahServer = new DrahServer({
    handlers: {
        // While the functions here can be sync or async,
        // in the client the corresponding function will
        // always be async.
        getAnswer: (options: { answerFor: string }) => 42,
    },
    sendToClient: (message: string) => sendMessageToClient(serializedData),
});
onMessagefromClient(function (message: string) => drahServer.receiveFromClient(message));
```

### drah-client

The **client environment** requires:

1. A `DrahClient` setup with:

    - a mechanism to send actions to the processor (via constructor option `sendToServer`)

2. The `DrahClient` configured to receive responses from the processor (via class method `receiveFromServer`)

#### Example

note: this example contains the following two placeholder functions that you need to implement.

-   sendMessageToServer: function which sends messsages to the server environment
-   onMessagefromServer: subscription which fires it's callback on messages from a server environment

```ts
import { DrahClient } from 'drah-client';

const drahClient = new DrahClient<ActionProcessorHandlers>({
    sendToServer: (serializedData) => sendMessageToServer(serializedData),
});
onMessagefromServer((message: string) => drahClient.receiveFromServer(event.data));

const answer = await drahClient.getAnswer({
    answerFor: 'Ultimate Question of Life, the Universe, and Everything',
});
// answer will be 42
```
