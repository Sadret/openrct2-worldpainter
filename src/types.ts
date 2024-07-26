/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

export type ToolShape = "square" | "circle" | "diamond";
export type ToolType = "brush" | "sculpt";
export type ToolMode = "relative" | "absolute" | "plateau";

export type LookUp<T> = { [key: number]: { [key: number]: T } };

export type Fun1Num<T = number> = (a: number) => T;
export type Fun2Num<T = number> = (a: number, b: number) => T;

export type SelectionDesc = {
    center: CoordsXY,
    tiles: CoordsXY[],
    transformation: Fun2Num<CoordsXY>,
};