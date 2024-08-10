/*****************************************************************************
 * Copyright (c) 2024 Sadret
*
* The OpenRCT2 plug-in "WorldPainter" is licensed
* under the GNU General Public License version 3.
*****************************************************************************/

/// <reference path="../../openrct2.d.ts" />

import * as TerrainManager from "./TerrainManager";
import * as Tools from "./Tools";
import * as Window from "./Window";

registerPlugin({
    name: "worldpainter",
    version: "beta-1",
    authors: ["Sadret"],
    type: "local",
    licence: "GPL-3.0",
    minApiVersion: 78, // 0.4.6 (crashes in older versions, probably before #20493)
    targetApiVersion: 98,
    main: () => {
        if (typeof ui === "undefined")
            return console.log("[worldpainter] Loading cancelled: game runs in headless mode.");

        Tools.init();
        Window.init();
        TerrainManager.init();
        ui.registerMenuItem("WorldPainter", () => Window.isActive.set(true));
        Window.isActive.set(true);
    },
});