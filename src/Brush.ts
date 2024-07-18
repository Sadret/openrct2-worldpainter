/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { applyMode, brushLength, brushNorm, brushRotation, brushWidth, dragMode, isActive, profileFun, sensitivity } from './Window';
import * as TerrainManager from "./TerrainManager";

const relative = (a: number, b: number) => a + b;
const absolute = (minZ: number, maxZ: number) => (a: number, b: number) => b < 0 ? Math.min(a, maxZ + b) : Math.max(a, minZ + b);

let down = false;
let handle: number | undefined = undefined;
let cursorLastVertical = 0;
let data: {
    cursor: CoordsXY,
    transformation: ((x: number, y: number) => CoordsXY),
    tiles: CoordsXY[],
    minZ: number,
    maxZ: number,
} | undefined = undefined;

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
            const pixelPerStep = 1 << (4 - ui.mainViewport.zoom);
            const delta = Math.round(cursorVerticalDiff / pixelPerStep);
            if (delta !== 0) {
                apply(delta);
                cursorLastVertical -= delta * pixelPerStep;
            }
        }
        if (dragMode.get() === "move" || !down)
            if (e.mapCoords && e.mapCoords.x && e.mapCoords.y) {
                if (!data || data.cursor.x !== e.mapCoords.x || data.cursor.y !== e.mapCoords.y) {
                    const dx = brushWidth.get(), dy = brushLength.get();
                    const d = Math.max(dx, dy);
                    const r = 0.75 * d; // > sqrt(2) * (d / 2)

                    const center = { x: (e.mapCoords.x >> 5) + (1 - dx & 1) / 2, y: (e.mapCoords.y >> 5) + (1 - dy & 1) / 2 };

                    const norm = brushNorm.get();
                    const tiles: CoordsXY[] = [];
                    const tf = getTransformation(center.x, center.y, brushRotation.get(), dx, dy);
                    let minZ = 255;
                    let maxZ = 0;

                    for (let x = Math.floor(center.x - r); x < center.x + r; x++)
                        for (let y = Math.floor(center.y - r); y < center.y + r; y++) {
                            const rel = tf(x, y);
                            if (norm(rel.x, rel.y) <= 1) {
                                tiles.push({ x: x, y: y });
                                let surfaceZ = TerrainManager.getSurface(x, y)?.baseHeight;
                                if (surfaceZ) {
                                    surfaceZ >>= 1;
                                    minZ = Math.min(minZ, surfaceZ);
                                    maxZ = Math.max(maxZ, surfaceZ);
                                }
                            }
                        }

                    data = {
                        cursor: e.mapCoords,
                        transformation: tf,
                        tiles: tiles,
                        minZ: minZ,
                        maxZ: maxZ,
                    };

                    ui.tileSelection.tiles = tiles.map(tile => ({ x: tile.x << 5, y: tile.y << 5 }));
                }
            } else {
                data = undefined;
                ui.tileSelection.tiles = [];
            }
    },
    onUp: (e: ToolEventArgs) => {
        down = false;
        TerrainManager.finalise(applyMode.get() === "relative" ? relative : absolute(data?.minZ || 255, data?.maxZ || 0));
        if (handle !== undefined) {
            context.clearInterval(handle);
            handle = undefined;
        }
    },
    onFinish: () => {
        ui.mainViewport.visibilityFlags &= ~(1 << 7);
        isActive.set(false);
        down = false;
        TerrainManager.finalise(applyMode.get() === "relative" ? relative : absolute(data?.minZ || 255, data?.maxZ || 0));
        if (handle !== undefined) {
            context.clearInterval(handle);
            handle = undefined;
        }
    },
};

export function init(): void {
    isActive.subscribe(value => value ? ui.activateTool(brush) : (ui.tool && ui.tool.id === "worldpainter-brush" && ui.tool.cancel()));
}

function getTransformation(cx: number, cy: number, angle: number, dx: number, dy: number) {
    const radians = angle * Math.PI / 180;
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);

    return (x: number, y: number) => {
        x -= cx;
        y -= cy;

        return {
            x: (x * cos - y * sin) / dx * 2,
            y: (x * sin + y * cos) / dy * 2,
        };
    };
}

function apply(delta: number = 1): void {
    if (!data) return;

    const tf = data.transformation;
    const profileFunction = profileFun.get();
    const profile: {
        [key: number]: {
            [key: number]: number;
        };
    } = {};

    function getZ(x: number, y: number): number {
        if (!profile[x])
            profile[x] = {};
        if (!profile[x][y]) {
            const rel = tf(x, y);
            profile[x][y] = profileFunction(rel.x, rel.y) * delta;
        }
        return profile[x][y];
    }

    TerrainManager.apply(data.tiles, getZ, applyMode.get() === "relative" ? relative : absolute(data.minZ, data.maxZ));
}