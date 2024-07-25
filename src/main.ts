/*****************************************************************************
 * Copyright (c) 2024 Sadret
*
* The OpenRCT2 plug-in "WorldPainter" is licensed
* under the GNU General Public License version 3.
*****************************************************************************/

/// <reference path="../../openrct2.d.ts" />

import * as TerrainManager from "./TerrainManager";
import * as Tools from './tools';
import * as Window from "./Window";

registerPlugin({
    name: "worldpainter",
    version: "1.0.0",
    authors: ["Sadret"],
    type: "local",
    licence: "GPL-3.0",
    minApiVersion: 80,
    targetApiVersion: 80,
    main: () => {
        Tools.init();
        Window.init();
        TerrainManager.init();
        ui.registerMenuItem("WorldPainter", () => Window.isActive.set(true));
        Window.isActive.set(true);
    },
});
