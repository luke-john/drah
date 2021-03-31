# drah-figma

Simplified communications between ui and main for figma plugin development.

## Example usage

```ts
// ./main/drahMain.ts
import type { UIActions } from "../ui/drahUi.ts"

const _mainActions = {
    setRootPluginData: (...parameters: Parameters<typeof figma.root.setPluginData>) =>
        figma.root.setPluginData(...parameters),
    getRootPluginData: (...parameters: Parameters<typeof figma.root.getPluginData>) =>
        figma.root.getPluginData(...parameters),
}

export const drahMain = setupDrahMain<UIActions>(_mainActions);
export type MainActions = typeof _mainActions

// ./main/index.ts
import drahMain from "./drahMain.ts"

const googleHtml = await drahMain.getGoogleHtml()

// ./ui/drahUi.ts
import type { MainActions } from "../main/drahMain.ts"

const _uiActions = {
    getGoogleHtml: async () => {
        const response = await fetch("http://google.com")
        const responseText = await response.text()
    }
}

export const drahUi = setupDrahMain<MainActions>(_uiActions);
export type UIActions = typeof _uiActions

// ./ui/index.ts
import drahUi from "./drahUi.ts"

await drahUi.setRootPluginData("test", "data")
await drahUi.getRootPluginData("test")
```
