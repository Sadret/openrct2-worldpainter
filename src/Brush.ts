/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { brushLength, brushNorm, brushWidth, dragMode, isActive, profileFun, sensitivity } from './Window';
import * as TerrainManager from "./TerrainManager";

let down = false;
let handle = 0;
let center: CoordsXY | undefined = undefined;
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

                const dx = brushWidth.get(), dy = brushLength.get();
                const sx = Math.ceil((center.x >> 5) - dx / 2), sy = Math.ceil((center.y >> 5) - dy / 2);
                const cx = sx + dx / 2, cy = sy + dy / 2;
                const ex = sx + dx, ey = sy + dy;

                const norm = brushNorm.get();
                const tiles: CoordsXY[] = [];

                for (let x = sx; x < ex; x++)
                    for (let y = sy; y < ey; y++)
                        if (norm((x + 0.5 - cx) / dx * 2, (y + 0.5 - cy) / dy * 2) <= 1)
                            tiles.push({ x: x << 5, y: y << 5 });

                ui.tileSelection.tiles = tiles;
            } else {
                center = undefined;
                ui.tileSelection.tiles = [];
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
        TerrainManager.reset();
        down = false;
        context.clearInterval(handle);
    },
};

export function init(): void {
    isActive.subscribe(value => value ? ui.activateTool(brush) : (ui.tool && ui.tool.id === "worldpainter-brush" && ui.tool.cancel()));
}

function apply(delta: number = 1): void {
    if (!center) return;

    const dx = brushWidth.get(), dy = brushLength.get();
    const sx = Math.ceil((center.x >> 5) - dx / 2), sy = Math.ceil((center.y >> 5) - dy / 2);
    const cx = sx + dx / 2, cy = sy + dy / 2;
    const ex = sx + dx, ey = sy + dy;

    const norm = brushNorm.get();
    const tiles: CoordsXY[] = [];

    const profileFunction = profileFun.get();
    const profile: TerrainManager.ProfileData = {};

    for (let x = sx; x <= ex; x++) {
        profile[x] = {};
        for (let y = sy; y <= ey; y++) {
            profile[x][y] = profileFunction((x - cx) / dx * 2, (y - cy) / dy * 2) * delta;
            if (norm((x + 0.5 - cx) / dx * 2, (y + 0.5 - cy) / dy * 2) <= 1)
                tiles.push({ x: x, y: y });
        }
    }

    TerrainManager.apply(tiles, profile);
}