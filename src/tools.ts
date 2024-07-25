/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { toolLength, toolNorm, toolRotation, toolWidth, isActive, sensitivity, activeTool } from './Window';
import * as TerrainManager from "./TerrainManager";
import { Fun2Num, SelectionDesc } from './types';
import { compute } from 'openrct2-flexui';

abstract class BaseTool {
    protected readonly desc: ToolDesc = {
        id: "worldpainter-" + this.getName(),
        cursor: "dig_down",
        filter: ["terrain", "water"],
        onStart: () => this._onStart(),
        onDown: (event: ToolEventArgs) => this.onDown(event),
        onMove: (event: ToolEventArgs) => this.onMove(event),
        onUp: () => this.onUp(),
        onFinish: () => this._onFinish(),
    };

    public activate(): void {
        ui.activateTool(this.desc);
    }

    public abstract getName(): "brush" | "sculpt";

    protected _onStart(): void {
        ui.mainViewport.visibilityFlags |= 1 << 7;
        this.onStart();
    }
    protected _onFinish(): void {
        this.onUp();
        ui.mainViewport.visibilityFlags &= ~(1 << 7);
        this.onFinish();
        if (activeTool.get() === this.getName())
            isActive.set(false);
    }
    // tool implementation
    protected onStart(): void { }
    protected onDown(event: ToolEventArgs): void { }
    protected onMove(event: ToolEventArgs): void { }
    protected onUp(): void { }
    protected onFinish(): void { }

    // helper methods
    private cursor: CoordsXY = undefined as never;
    private tiles: CoordsXY[] = [];
    private transformation: Fun2Num<CoordsXY> = (x, y) => ({ x, y });

    protected apply(delta: number): void {
        TerrainManager.apply(delta);
    }

    protected setTileSelection(event: ToolEventArgs): void {
        if (!event.mapCoords || !event.mapCoords.x || !event.mapCoords.y) {
            this.tiles = [];
            ui.tileSelection.tiles = [];
            return;
        }

        if (!this.cursor || this.cursor.x !== event.mapCoords.x || this.cursor.y !== event.mapCoords.y) {
            this.cursor = { x: event.mapCoords.x, y: event.mapCoords.y };

            const dx = toolWidth.get(), dy = toolLength.get();
            const d = Math.max(dx, dy);
            const r = 0.75 * d; // > sqrt(2) * (d / 2)

            const center = { x: (event.mapCoords.x >> 5) + (1 - dx & 1) / 2, y: (event.mapCoords.y >> 5) + (1 - dy & 1) / 2 };

            const norm = toolNorm.get();
            this.tiles = [];
            this.transformation = getTransformation(center.x, center.y, toolRotation.get(), dx, dy);

            for (let x = Math.floor(center.x - r); x < center.x + r; x++)
                for (let y = Math.floor(center.y - r); y < center.y + r; y++) {
                    const rel = this.transformation(x, y);
                    if (norm(rel.x, rel.y) <= 1) //{
                        this.tiles.push({ x: x, y: y });
                }

            ui.tileSelection.tiles = this.tiles.map(tile => ({ x: tile.x << 5, y: tile.y << 5 }));
        }
    }

    protected getTileSelection(): SelectionDesc {
        return {
            center: this.cursor,
            tiles: this.tiles,
            transformation: this.transformation,
        };
    }
}

class Brush extends BaseTool {
    private handle: number = -1;
    private down: boolean = false;

    public getName(): "brush" {
        return "brush";
    }

    protected onDown(): void {
        this.down = true;
        const msDelay = 1 << (10 - Math.min(5, sensitivity.get()));
        const delta = 2 ** Math.max(0, sensitivity.get() - 5);
        TerrainManager.setSelection(this.getTileSelection());
        const handler = () => {
            this.apply(delta);
            TerrainManager.softReset();
        };
        handler();
        this.handle = context.setInterval(() => handler(), msDelay);
    }

    protected onMove(event: ToolEventArgs): void {
        this.setTileSelection(event);
        if (this.down)
            TerrainManager.setSelection(this.getTileSelection());
    }

    protected onUp(): void {
        this.down = false;
        context.clearInterval(this.handle);
    }
}

class Sculpt extends BaseTool {
    private cursorVertical: number = 0;
    private down: boolean = false;
    private lastDelta: number = 0;

    public getName(): "sculpt" {
        return "sculpt";
    }

    protected onDown(event: ToolEventArgs): void {
        this.cursorVertical = event.screenCoords.y;
        this.down = true;
        TerrainManager.setSelection(this.getTileSelection());
    }

    protected onMove(event: ToolEventArgs): void {
        if (this.down) {
            const cursorVerticalDiff = this.cursorVertical - event.screenCoords.y;
            const pixelPerStep = 1 << (4 - ui.mainViewport.zoom);
            const delta = Math.round(cursorVerticalDiff / pixelPerStep);
            if (delta !== this.lastDelta)
                this.apply(delta);
        } else
            this.setTileSelection(event);
    }

    protected onUp(): void {
        this.down = false;
        this.lastDelta = 0;
        TerrainManager.softReset();
    }
}

function getTransformation(cx: number, cy: number, angle: number, dx: number, dy: number): Fun2Num<CoordsXY> {
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

export function init(): void {
    const tools = {
        "brush": new Brush(),
        "sculpt": new Sculpt(),
    };
    compute(isActive, activeTool, (isActive, activeTool) => isActive ? tools[activeTool].activate() : (ui.tool && ui.tool.id.startsWith("worldpainter") && ui.tool.cancel()));
}