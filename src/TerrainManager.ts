/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { Fun2Num, LookUp, SelectionDesc } from './types';
import { isActive, profileFun, toolMode } from './Window';

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

function setSurfaceZ(x: number, y: number, fractional: Num4, up = true): void {
    const surface = getSurface(x, y);
    if (!surface) return;

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

    const args: LandSetHeightArgs = {
        x: x << 5,
        y: y << 5,
        height: height << 1,
        style: slope,
    };
    // set new height and slope
    context.queryAction("landsetheight", args,
        result => result.error || context.executeAction("landsetheight", args)
    );
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
    const profileFunction = profileFun.get();
    const profile = new Profile((x, y) => {
        const rel = selectionDesc.transformation(x, y);
        return profileFunction(rel.x, rel.y);
    });
    deltaProfile = (x, y) => profile.getZ(x, y);
}

const cornerOffsets = [[1, 1], [1, 0], [0, 0], [0, 1]];
export function apply(delta: number): void {
    tiles.forEach(({ x, y }) => {
        const oldProfile = originalProfile.getZ(x, y);
        const newProfile = cornerOffsets.map(([dx, dy], idx) => strategy(oldProfile[idx], deltaProfile(x + dx, y + dy) * delta)) as Num4;
        currentProfile.setZ(x, y, newProfile);
        setSurfaceZ(x, y, newProfile);
    });
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
    tiles.forEach(({ x, y }) => {
        const oldProfile = originalProfile.getZ(x, y);
        const newProfile = cornerOffsets.map(([dx, dy], idx) => fun2(oldProfile[idx] + delta, profile.getZ(x + dx, y + dy))) as Num4;
        setSurfaceZ(x, y, newProfile, delta > 0);
    });
}

export function flatten(tiles: CoordsXY[], delta: number): void {
    tiles.forEach(({ x, y }) => {
        const surface = getSurface(x, y);
        if (surface) {
            if (delta > 0) {
                if (surface.slope)
                    surface.baseHeight += 2;
                if (surface.slope & 0x10)
                    surface.baseHeight += 2;
            }
            surface.slope = 0;
        }
    });
}

export function rough(tiles: CoordsXY[], delta: number): void {
    tiles.forEach(({ x, y }) => {
        const surface = getSurface(x, y);
        if (surface)
            surface.slope = Math.round(Math.random() * 16);
    });
}