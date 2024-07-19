/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

/** input and output in [-1,1] */
export type ProfileFun1D = (r: number) => number;

/** input and output in [-1,1] */
export type ProfileFun2D = (x: number, y: number) => number;

/** input are tile coordinates, output is height delta */
export type Profile = (x: number, y: number) => number;

export type ProfileModifier = (f: ProfileFun1D, p: number) => ProfileFun1D;

export type Norm = (x: number, y: number) => number;

export type ToolMode = "sculpt" | "brush";
export type ToolShape = "square" | "circle" | "diamond";

export type SculptMode = "relative" | "absolute";