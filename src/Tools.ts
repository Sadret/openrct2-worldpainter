/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { compute } from "openrct2-flexui";
import * as Shapes from "./Shapes";
import * as TerrainManager from "./TerrainManager";
import type { Fun2Num, SelectionDesc, ToolType } from "./types";
import { brushDirection, brushSensitivity, isActive, specialMode, toolLength, toolRotation, toolShape, toolType, toolWidth } from "./Window";

const msDelay = compute(brushSensitivity, sen => 1 << (10 - Math.min(5, sen)));
const brushDelta = compute(brushSensitivity, brushDirection, (sen, biv) => 2 ** Math.max(0, sen - 5) * (biv === "up" ? 1 : -1));

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

    public abstract getName(): ToolType;

    private _onStart(): void {
        ui.mainViewport.visibilityFlags |= 1 << 7;
        this.onStart();
    }
    private _onFinish(): void {
        this.onUp();
        ui.mainViewport.visibilityFlags &= ~(1 << 7);
        this.onFinish();
        if (toolType.get() === this.getName())
            isActive.set(false);
    }

    // tool implementation
    protected onStart(): void { }
    protected onDown(_event: ToolEventArgs): void { }
    protected onMove(_event: ToolEventArgs): void { }
    protected onUp(): void { }
    protected onFinish(): void { }

    // helper methods
    protected cursor: CoordsXY = undefined as never;
    protected tiles: CoordsXY[] = [];
    protected transformation: Fun2Num<CoordsXY> = (x, y) => ({ x, y });

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

            const center = { x: (event.mapCoords.x >> 5) + (dx & 1) / 2, y: (event.mapCoords.y >> 5) + (dy & 1) / 2 };

            const shape = Shapes[toolShape.get()];
            this.tiles = [];
            this.transformation = getTransformation(center.x, center.y, toolRotation.get(), dx, dy);

            for (let x = Math.floor(center.x - r); x < center.x + r; x++)
                for (let y = Math.floor(center.y - r); y < center.y + r; y++) {
                    const rel = this.transformation(x + 0.5, y + 0.5); // center of tile
                    if (shape(rel.x, rel.y) <= 1) //{
                        this.tiles.push({ x: x, y: y });
                }

            ui.tileSelection.tiles = this.tiles.map(tile => ({ x: tile.x << 5, y: tile.y << 5 }));
        }
    }

    protected getTileSelection(): SelectionDesc {
        return {
            center: { x: this.cursor.x >> 5, y: this.cursor.y >> 5 },
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

    protected apply(): void {
        super.apply(brushDelta.get());
        TerrainManager.softReset();
    }

    protected onDown(): void {
        this.down = true;
        TerrainManager.setSelection(this.getTileSelection());
        this.apply();
        this.handle = context.setInterval(() => this.apply(), msDelay.get());
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
            this.lastDelta = delta;
        } else
            this.setTileSelection(event);
    }

    protected onUp(): void {
        this.down = false;
        this.lastDelta = 0;
        TerrainManager.softReset();
    }
}

class Special extends BaseTool {
    private handle: number = -1;

    public getName(): "special" {
        return "special";
    }

    protected apply(): void {
        TerrainManager[specialMode.get()](this.tiles, brushDelta.get());
    }

    protected onDown(): void {
        this.apply();
        this.handle = context.setInterval(() => this.apply(), msDelay.get());
    }

    protected onMove(event: ToolEventArgs): void {
        this.setTileSelection(event);
    }

    protected onUp(): void {
        context.clearInterval(this.handle);
    }

    protected onFinish(): void {
        TerrainManager.hardReset();
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
        "special": new Special(),
    };
    compute(isActive, toolType, (isActive, activeTool) => isActive ? tools[activeTool].activate() : (ui.tool && ui.tool.id.startsWith("worldpainter") && ui.tool.cancel()));
}