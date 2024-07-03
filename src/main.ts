/*****************************************************************************
 * Copyright (c) 2024 Sadret
*
* The OpenRCT2 plug-in "WorldPainter" is licensed
* under the GNU General Public License version 3.
*****************************************************************************/

/// <reference path="../../openrct2.d.ts" />

import * as Window from "./Window";
import * as Brush from "./Brush";

registerPlugin({
    name: "worldpainter",
    version: "1.0.0",
    authors: ["Sadret"],
    type: "local",
    licence: "GPL-3.0",
    minApiVersion: 80,
    targetApiVersion: 80,
    main: () => {
        Brush.init();
        ui.registerMenuItem("WorldPainter", Window.open);
        Window.open();
    },
});
