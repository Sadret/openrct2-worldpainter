/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { brushLength, brushWidth, isActive } from './Window';
import type { ProfileFun } from "./types";
import * as TerrainManager from "./TerrainManager";

const cos1 = Math.cos(1);

let flat: ProfileFun = () => 1;
let gauss: ProfileFun = (x, y) => Math.pow(256, -(x * x + y * y));
let volcano: ProfileFun = (x, y) => 1 - Math.abs(1 - 1.5 * gauss(x, y));
let sine: ProfileFun = (x, y) => 0.5 + Math.cos(Math.min(Math.sqrt(x * x + y * y), 1) * Math.PI) / 2;
let sineCap: ProfileFun = (x, y) => (Math.cos(Math.min(Math.sqrt(x * x + y * y), 1)) - cos1) / (1 - cos1);
let sphere: ProfileFun = (x, y) => Math.sqrt(1 - x * x - y * y) || 0;
let profileFun: ProfileFun = volcano;

let center: CoordsXY = { x: 0, y: 0 };
let cursorLastVertical: number | undefined = undefined;

const brush: ToolDesc = {
    id: "worldpainter-brush",
    cursor: "dig_down",
    filter: ["terrain", "water"],

    onStart: () => {
        ui.mainViewport.visibilityFlags |= 1 << 7;
        isActive.set(true);
    },
    onDown: (e: ToolEventArgs) => {
        cursorLastVertical = e.screenCoords.y;
    },
    onMove: (e: ToolEventArgs) => {
        if (cursorLastVertical) {
            const cursorCurrentVertical = e.screenCoords.y;
            const cursorVerticalDiff = cursorLastVertical - cursorCurrentVertical;
            if (cursorVerticalDiff !== 0)
                apply(cursorVerticalDiff);
            cursorLastVertical = cursorCurrentVertical;
        } else if (e.mapCoords) {
            ui.tileSelection.tiles = [center = e.mapCoords];
        }
    },
    onUp: (e: ToolEventArgs) => {
        TerrainManager.reset();
        cursorLastVertical = undefined;
    },
    onFinish: () => {
        ui.mainViewport.visibilityFlags &= ~(1 << 7);
        isActive.set(false);
    },
};

export function init(): void {
    isActive.subscribe(value => value ? ui.activateTool(brush) : (ui.tool && ui.tool.id === "worldpainter-brush" && ui.tool.cancel()));
}

function apply(cursorVerticalDiff: number): void {
    // TODO: off by one, even and uneven
    const cx = center.x >> 5, cy = center.y >> 5;
    const rx = brushWidth.get() >> 1, ry = brushLength.get() >> 1;

    const profile: TerrainManager.ProfileData = {};
    for (let x = cx - rx; x <= cx + rx; x++) {
        profile[x] = {};
        for (let y = cy - ry; y <= cy + ry; y++)
            profile[x][y] = profileFun((x - cx) / rx, (y - cy) / ry) * cursorVerticalDiff / (1 << 4) * Math.pow(2, ui.mainViewport.zoom);
    }
    TerrainManager.apply(cx - rx, cx + rx, cy - ry, cy + ry, profile);
}