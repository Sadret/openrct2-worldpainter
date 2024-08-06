/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import * as Profiles from "./Profiles";
import * as Shapes from "./Shapes";
import type { Fun2Num, LookUp, SelectionDesc } from "./types";
import { isActive, toolMode, toolProfile, toolShape } from "./Window";

// array includes
function includes(array: any[], value: any): boolean {
    for (const val of array)
        if (val === value)
            return true;
    return false;
}

type Num4 = [number, number, number, number];

function getSurface(x: number, y: number): SurfaceElement | undefined {
    if (x < 1 || x >= map.size.x - 1 || y < 1 || y >= map.size.y - 1)
        return undefined;

    const tile = map.getTile(x, y);
    for (const element of tile.elements)
        if (element.type === "surface")
            return element;

    return undefined;
}

function getSurfaceZ(x: number, y: number): Num4 {
    const surface = getSurface(x, y);
    if (!surface) return [0, 0, 0, 0];

    const baseHeight = surface.baseHeight;
    const slope = surface.slope;

    return [0, 1, 2, 3].map(corner =>
        baseHeight / 2 // baseHeight in terrain steps
        + (slope >> corner & 1) // add 1 if corner is raised
        + (slope >> 4 & 1) // add 1 if slope is diagonally raised
        * (1 - (slope >> ((corner + 2) & 3) & 1)) // but only if the opposite corner is lowered
    ) as Num4;
}

function getActionArgs(x: number, y: number, fractional: Num4, up = true): LandSetHeightArgs | undefined {
    const surface = getSurface(x, y);
    if (!surface) return undefined;

    let integral = fractional.map(corner => Math.round(corner));

    if (up)
        // raise just below height of adjacent corners
        integral = integral.map((_, corner) => Math.max(
            integral[corner],
            integral[(corner + 1) & 3] - 1,
            integral[(corner + 2) & 3] - 2,
            integral[(corner + 3) & 3] - 1,
        ));
    else
        // lower just above height of adjacent corners
        integral = integral.map((_, corner) => Math.min(
            integral[corner],
            integral[(corner + 1) & 3] + 1,
            integral[(corner + 2) & 3] + 2,
            integral[(corner + 3) & 3] + 1,
        ));

    // subtract new height
    const height = Math.max(Math.min(...integral, 0x7F), 1);
    integral = integral.map(corner => Math.max(Math.min(corner, 0x7f) - height, 0));

    // calculate slope
    const slope = integral.reduce((slope, z, idx) => {
        if (z) slope |= 1 << idx;
        if (z > 1) slope |= (1 << 4);
        return slope;
    }, 0);

    return {
        x: x << 5,
        y: y << 5,
        height: height << 1,
        style: slope,
    };
}

function executeAll(tiles: CoordsXY[], fun: (tile: CoordsXY) => LandSetHeightArgs | undefined): boolean {
    if (tiles.length === 0) return true;

    if (network.mode === "client") {
        const group = network.getGroup(network.currentPlayer.group);
        if (!includes(group.permissions, "terraform")) {
            ui.showError(
                context.formatString("{STRINGID}", 5637),
                context.formatString("{STRINGID}", 5638),
            );
            return false;
        }
    }

    let cost = 0;
    let errorResult: GameActionResult = {};
    const queryOk: LandSetHeightArgs[] = [];

    tiles.map(fun).filter(args => args !== undefined).forEach(args => context.queryAction("landsetheight", args, result => {
        switch (result.error) {
            case 0:
            case 4:
                queryOk.push(args);
                cost += result.cost || 0;
                break;
            default:
                errorResult = result;
        }
    }));

    // all actions fail
    if (queryOk.length === 0) {
        ui.showError(
            errorResult.errorTitle || "",
            errorResult.errorMessage || "",
        );
        return false;
    }

    // insufficient funds
    if (cost > park.cash && !park.getFlag("noMoney")) {
        ui.showError(
            context.formatString("{STRINGID}", 5637),
            context.formatString("{STRINGID}", 827, cost),
        );
        return false;
    }

    queryOk.forEach(args => context.executeAction("landsetheight", args));
    return true;
}

class Profile<T = Num4> {
    private readonly initialZ: Fun2Num<T>;
    private data: LookUp<T> = {};

    public constructor(initialZ: Fun2Num<T>) {
        this.initialZ = initialZ;
    }

    public setZ(x: number, y: number, z: T): void {
        if (!this.data[x])
            this.data[x] = {};
        this.data[x][y] = z;
    }

    public getZ(x: number, y: number): T {
        if (this.data[x] && this.data[x][y])
            return this.data[x][y];
        const z = this.initialZ(x, y);
        this.setZ(x, y, z);
        return z;
    }

    public lazyClone(): Profile<T> {
        return new Profile<T>((x, y) => this.getZ(x, y));
    }
}

let currentProfile = new Profile((x, y) => getSurfaceZ(x, y));
let originalProfile = currentProfile.lazyClone();

export function softReset(): void {
    originalProfile = currentProfile.lazyClone();
}

export function hardReset(): void {
    currentProfile = new Profile((x, y) => getSurfaceZ(x, y));
    softReset();
}

let strategy: Fun2Num = () => 0;
let tiles: CoordsXY[] = [];
let deltaProfile: Fun2Num = () => 0;

export function setSelection(selectionDesc: SelectionDesc): void {
    strategy = getStrategy(selectionDesc);
    tiles = selectionDesc.tiles;
    const profileFun: Fun2Num = (x, y) => Profiles[toolProfile.get()](Math.min(Shapes[toolShape.get()](x, y), 1));
    const profile = new Profile((x, y) => {
        const rel = selectionDesc.transformation(x, y);
        return profileFun(rel.x, rel.y);
    });
    deltaProfile = (x, y) => profile.getZ(x, y);
}

const cornerOffsets = [[1, 1], [1, 0], [0, 0], [0, 1]];
export function apply(delta: number): void {
    const changedProfile = currentProfile.lazyClone();
    if (executeAll(tiles, ({ x, y }) => {
        const oldProfile = originalProfile.getZ(x, y);
        const newProfile = cornerOffsets.map(([dx, dy], idx) => strategy(oldProfile[idx], deltaProfile(x + dx, y + dy) * delta)) as Num4;
        changedProfile.setZ(x, y, newProfile);
        return getActionArgs(x, y, newProfile);
    }))
        currentProfile = changedProfile;
}

function getStrategy(selectionDesc: SelectionDesc): Fun2Num {
    switch (toolMode.get()) {
        case "relative":
            return (surface, delta) => surface + delta;
        case "absolute":
            let minZ = 255, maxZ = 0;
            selectionDesc.tiles.forEach(({ x, y }) => {
                let surfaceZ = getSurface(x, y)?.baseHeight;
                if (surfaceZ) {
                    surfaceZ >>= 1;
                    minZ = Math.min(minZ, surfaceZ);
                    maxZ = Math.max(maxZ, surfaceZ);
                }
            });
            return (surface, delta) => delta < 0 ? Math.min(surface, maxZ + delta) : Math.max(surface, minZ + delta);
        case "plateau":
            const { x, y } = selectionDesc.center;
            const targetZ = (getSurface(x, y)?.baseHeight || 0) >> 1;
            return (surface, delta) => {
                switch (true) {
                    case delta < 0 && targetZ < surface:
                        return Math.max(targetZ, surface + delta);
                    case delta > 0 && targetZ > surface:
                        return Math.min(targetZ, surface + delta);
                    default:
                        return surface;
                }
            };
    }
}

export function init(): void {
    isActive.subscribe(value => value && hardReset());
}

export function smooth(tiles: CoordsXY[], delta: number): void {
    hardReset();
    const fun1 = delta > 0 ? Math.max : Math.min;
    const fun2 = delta > 0 ? Math.min : Math.max;

    const profile = new Profile<number>((x, y) => {
        const cornerHeights = cornerOffsets
            .map(([dx, dy], idx) => [x - dx, y - dy, idx])
            .filter(([x, y]) => x > 0 && x < map.size.x - 1 && y > 0 && y < map.size.y - 1)
            .map(([x, y, idx]) => originalProfile.getZ(x, y)[idx]);
        return fun1(...cornerHeights);
    });
    executeAll(tiles, ({ x, y }) => {
        const oldProfile = originalProfile.getZ(x, y);
        const newProfile = cornerOffsets.map(([dx, dy], idx) => fun2(oldProfile[idx] + delta, profile.getZ(x + dx, y + dy))) as Num4;
        return getActionArgs(x, y, newProfile, delta > 0);
    });
}

export function flat(tiles: CoordsXY[], delta: number): void {
    executeAll(tiles, ({ x, y }) => {
        const surface = getSurface(x, y);
        if (surface) {
            let height = surface.baseHeight;
            if (delta > 0) {
                if (surface.slope)
                    height += 2;
                if (surface.slope & 0x10)
                    height += 2;
            }
            return {
                x: x << 5,
                y: y << 5,
                height: height,
                style: 0,
            };
        }
    });
}

export function rough(tiles: CoordsXY[]): void {
    executeAll(tiles, ({ x, y }) => {
        const surface = getSurface(x, y);
        if (surface)
            return {
                x: x << 5,
                y: y << 5,
                height: surface.baseHeight,
                style: Math.round(Math.random() * 16),
            };
    });
}
