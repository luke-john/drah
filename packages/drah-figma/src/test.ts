import { setupDrahMain } from './main';
import { setupDrahUI } from './ui';

global.window = {
    // @ts-ignore
    parent: {
        postMessage: ({ pluginMessage }, _scope) => {
            if (pluginMessage) {
                new Promise<void>((res) => {
                    // note: it's expected that the global.figma.ui.onmessage will be setup by tests consuming this
                    // @ts-ignore
                    setTimeout(figma.ui.onmessage, 0, JSON.parse(JSON.stringify(pluginMessage)));
                    res();
                });
            }
        },
    },
};

// @ts-ignore
global.figma = {
    ui: {
        postMessage: (pluginMessage: { type: string; data: string }) => {
            // note: it's expected that the global.window will be setup by tests consuming this
            // @ts-ignore
            new Promise<void>((res) => {
                // @ts-ignore
                setTimeout(window.onmessage, 0, JSON.parse(JSON.stringify({ data: { pluginMessage } })));
                res();
            });
        },
    },
};

describe('Figma drah main and ui communicate', () => {
    const mainData = 'main cat';
    const mainFailure = new Error('main failure');
    const _mainActions = {
        testDataRetrieval: () => mainData,
        testFailureProxying: () => {
            throw mainFailure;
        },
    };

    const drahMain = setupDrahMain<typeof _uiActions>(_mainActions);

    const uiData = 'ui cat';
    const uiFailure = new Error('ui failure');
    const _uiActions = {
        testDataRetrieval: () => uiData,
        testFailureProxying: () => {
            throw uiFailure;
        },
    };

    const drahUI = setupDrahUI<typeof _mainActions>(_uiActions);

    test('drah main actions pass through data', async () => {
        const dataRecivedOnUI = await drahMain.testDataRetrieval();

        expect(dataRecivedOnUI).toBe(uiData);
    });

    test('drah main actions proxy through errors', async () => {
        expect.assertions(1);

        try {
            await drahMain.testFailureProxying();
        } catch (error) {
            expect(error).toEqual(uiFailure);
        }
    });

    test('drah ui actions pass through data', async () => {
        const dataRecivedOnUI = await drahUI.testDataRetrieval();

        expect(dataRecivedOnUI).toBe(mainData);
    });

    test('drah uimain actions proxy through errors', async () => {
        expect.assertions(1);

        try {
            await drahUI.testFailureProxying();
        } catch (error) {
            expect(error).toEqual(mainFailure);
        }
    });
});
