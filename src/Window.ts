/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { button, compute, graphics, groupbox, horizontal, spinner, store, twoway, window } from "openrct2-flexui";
import { Fun2Num, SpecialMode, ToolMode, ToolShape, ToolType } from './types';
import { linear, createProfileImage, constant, gauss, circle, euclidean, supremum, manhattan, toFun2D, inverted, cubic3, cubic1, cubic4, cubic2, cubic5 } from './profiles';
import { imageOf } from "./images";

function tooltipOf(obj: any): string {
    switch (obj) {
        // isValley
        case false: return "Raise";
        case true: return "Lower";
        // tool mode
        case "brush": return "Brush";
        case "sculpt": return "Sculpt";
        // tool shape
        case "square": return "Square";
        case "circle": return "Circle";
        case "diamond": return "Diamond";
        // tool type
        case "absolute": return "Absolute";
        case "relative": return "Relative";
        // basic shapes
        case constant: return "Flat";
        case linear: return "Cone";
        case gauss: return "Bell";
        case circle: return "Sphere";
        // cubic shapes
        case cubic1: return "Cubic 1"; // dome
        case cubic2: return "Cubic 2"; // ???
        case cubic3: return "Cubic 3"; // bell
        case cubic4: return "Cubic 4"; // peak
        case cubic5: return "Cubic 5"; // peak
        // default
        default: return "(unknown)";
    };
}

function normOf(shape: ToolShape): Fun2Num {
    switch (shape) {
        case "square": return supremum;
        case "circle": return euclidean;
        case "diamond": return manhattan;
    }
}

function graphicsOf(name: Parameters<typeof imageOf>[0]) {
    const image = imageOf(name);
    return graphics({
        ...image,
        onDraw: g => g.image(image.image, 0, 0),
    });
}

const toolShapes: ToolShape[] = ["square", "circle", "diamond"];
const toolTypes: ToolType[] = ["brush", "sculpt", "special"];
const toolModes: ToolMode[] = ["relative", "absolute", "plateau"];
const specialModes: SpecialMode[] = ["smooth"];

// tool is active
export const isActive = store(false);

// tool shape
const toolShape = store<ToolShape>("circle");
export const toolNorm = compute(toolShape, normOf);

// tool size and rotation
export const toolWidth = store(40);
const toolLengthInput = store(8);
const squareAspectRatio = store(true);
export const toolLength = compute(toolWidth, toolLengthInput, squareAspectRatio, (w, l, s) => s ? w : l);
export const toolRotation = store(0);

// tool type
export const toolType = store<ToolType>("brush");

// tool settings
export const sensitivity = store(3);
export const toolMode = store<ToolMode>("relative");
export const brushIsValley = store(false);
export const specialMode = store<SpecialMode>("smooth");

// mountain shapes
const profile = store(cubic3);

// resulting profile function
export const profileFun = compute(toolNorm, toolType, brushIsValley, profile, (norm, type, isValley, profile) => toFun2D(isValley && type === "brush" ? inverted(profile) : profile, norm));

const win = window({
    title: "WorldPainter",
    width: 258,
    height: "auto",
    content: [
        groupbox({
            text: "Tool shape",
            content: [
                horizontal({
                    width: "100%",
                    spacing: "1w",
                    content: toolShapes.map(
                        shape => button({
                            ...imageOf(shape),
                            onClick: () => toolShape.set(shape),
                            isPressed: compute(toolShape, active => active === shape),
                            tooltip: tooltipOf(shape),
                        }),
                    ),
                }),
            ],
        }),
        groupbox({
            text: "Tool size and rotation",
            content: [
                horizontal({
                    content: [
                        graphicsOf("size"),
                        spinner({
                            minimum: 2,
                            value: twoway(toolWidth),
                        }),
                        button({
                            image: 29440,
                            onClick: () => squareAspectRatio.set(!squareAspectRatio.get()),
                            isPressed: squareAspectRatio,
                            height: 14,
                            width: 20,
                        }),
                        spinner({
                            minimum: 2,
                            value: twoway(toolLengthInput),
                            disabled: squareAspectRatio,
                        }),
                        graphicsOf("rotation"),
                        spinner({
                            value: twoway(toolRotation),
                            step: 5,
                            format: v => `${v}°`,
                        }),
                    ],
                }),
            ],
        }),
        groupbox({
            text: "Tool type",
            width: "100%",
            content: [
                horizontal({
                    content: toolTypes.map(type => button({
                        ...imageOf(type),
                        tooltip: tooltipOf(type),
                        onClick: () => toolType.set(type),
                        isPressed: compute(toolType, val => val === type),
                    })),
                }),
            ],
        }),
        groupbox({
            text: "Tool settings: TODO",
            content: [
                horizontal({
                    content: [
                        ...toolModes.map(mode => button({
                            ...imageOf(mode),
                            tooltip: tooltipOf(mode),
                            onClick: () => toolMode.set(mode),
                            isPressed: compute(toolMode, val => val === mode),
                        })),
                    ],
                }),
                horizontal({
                    content: [
                        button({
                            ...imageOf("sensitivity"),
                        }),
                        spinner({
                            minimum: 0,
                            maximum: 10,
                            value: twoway(sensitivity),
                        }),
                        ...[false, true].map(
                            val => button({
                                width: 24,
                                height: 24,
                                image: 5147 - Number(val) * 2,
                                onClick: () => brushIsValley.set(val),
                                isPressed: compute(brushIsValley, active => active === val),
                                tooltip: tooltipOf(val),
                            }),
                        ),
                    ],
                }),
                horizontal({
                    content: specialModes.map(mode => button({
                        height: 24,
                        text: mode,
                        tooltip: tooltipOf(mode),
                        onClick: () => specialMode.set(mode),
                        isPressed: compute(specialMode, val => val === mode),
                    })),
                }),
            ],
        }),
        groupbox({
            text: "Mountain shape",
            content: [
                horizontal({
                    content: [constant, linear, gauss, circle].map(
                        profileFun => button({
                            width: 44,
                            height: 24,
                            image: compute(brushIsValley, isValley => createProfileImage(isValley ? inverted(profileFun) : profileFun)),
                            onClick: () => profile.set(profileFun),
                            isPressed: compute(profile, active => active === profileFun),
                            tooltip: tooltipOf(profileFun),
                        }),
                    ),
                }),
                horizontal({
                    content: [cubic1, cubic2, cubic3, cubic4, cubic5].map(
                        profileFun => button({
                            width: 44,
                            height: 24,
                            image: compute(brushIsValley, isValley => createProfileImage(isValley ? inverted(profileFun) : profileFun)),
                            onClick: () => profile.set(profileFun),
                            isPressed: compute(profile, active => active === profileFun),
                            tooltip: tooltipOf(profileFun),
                        }),
                    ),
                }),
            ],
        }),
    ],
    onOpen: () => isActive.set(true),
    onClose: () => isActive.set(false),
});

export function init(): void {
    isActive.subscribe(value => value ? win.open() : win.close());
}
