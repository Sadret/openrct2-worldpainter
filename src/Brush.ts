/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { brushLength, brushWidth, dragMode, isActive, profileFun, sensitivity } from './Window';
import type { ProfileFun2D } from "./types";
import * as TerrainManager from "./TerrainManager";
import { button } from 'openrct2-flexui';

let down = false;
let handle = 0;
let center = { x: 0, y: 0 };
let cursorLastVertical = 0;

const brush: ToolDesc = {
    id: "worldpainter-brush",
    cursor: "dig_down",
    filter: ["terrain", "water"],

    onStart: () => {
        ui.mainViewport.visibilityFlags |= 1 << 7;
        isActive.set(true);
    },
    onDown: (e: ToolEventArgs) => {
        down = true;
        if (dragMode.get() === "apply")
            cursorLastVertical = e.screenCoords.y;
        else {
            const msDelay = 1 << (10 - Math.min(5, sensitivity.get()));
            const delta = 2 ** Math.max(0, sensitivity.get() - 5);
            apply(delta);
            handle = context.setInterval(() => apply(delta), msDelay);
        }
    },
    onMove: (e: ToolEventArgs) => {
        if (dragMode.get() === "apply" && down) {
            const cursorCurrentVertical = e.screenCoords.y;
            const cursorVerticalDiff = cursorLastVertical - cursorCurrentVertical;
            if (cursorVerticalDiff !== 0)
                apply(cursorVerticalDiff * 2 ** (ui.mainViewport.zoom - 4));
            cursorLastVertical = cursorCurrentVertical;
        }
        if (dragMode.get() === "move" || !down)
            if (e.mapCoords && e.mapCoords.x && e.mapCoords.y) {
                center = e.mapCoords;
                const sx = center.x - ((brushWidth.get() >> 1) << 5), sy = center.y - ((brushLength.get() >> 1) << 5);
                const ex = sx + (brushWidth.get() - 1 << 5), ey = sy + (brushLength.get() - 1 << 5);
                ui.tileSelection.range = {
                    leftTop: { x: sx, y: sy, },
                    rightBottom: { x: ex, y: ey, },
                };
            }
    },
    onUp: (e: ToolEventArgs) => {
        TerrainManager.reset();
        down = false;
        context.clearInterval(handle);
    },
    onFinish: () => {
        ui.mainViewport.visibilityFlags &= ~(1 << 7);
        isActive.set(false);
    },
};

export function init(): void {
    isActive.subscribe(value => value ? ui.activateTool(brush) : (ui.tool && ui.tool.id === "worldpainter-brush" && ui.tool.cancel()));
}

function apply(delta: number = 1): void {
    const dx = brushWidth.get(), dy = brushLength.get();
    const sx = Math.ceil((center.x >> 5) - dx / 2), sy = Math.ceil((center.y >> 5) - dy / 2);
    const cx = sx + dx / 2, cy = sy + dy / 2;
    const ex = sx + dx, ey = sy + dy;

    const profile: TerrainManager.ProfileData = {};
    for (let x = sx; x <= ex; x++) {
        profile[x] = {};
        for (let y = sy; y <= ey; y++)
            profile[x][y] = profileFun.get()((x - cx) / dx * 2, (y - cy) / dy * 2) * delta;
    }
    TerrainManager.apply(sx, ex, sy, ey, profile);
}