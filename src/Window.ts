/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { button, compute, graphics, groupbox, horizontal, spinner, store, twoway, vertical, window } from "openrct2-flexui";
import { ToolMode, ProfileFun1D, ProfileModifier, ToolShape, Norm, ToolType } from './types';
import { linear, createProfileImage, constant, gauss, circle, euclidean, supremum, manhattan, unmodified, crater, mesa1, mesa2, toFun2D, inverted, cubic3, cubic1, cubic4, cubic2, cubic5 } from './profiles';
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
        // toolModifer
        case unmodified: return "Unmodified";
        case mesa1: return "Mesa 1";
        case mesa2: return "Mesa 2";
        case crater: return "Crater";
        // default
        default: return "(unknown)";
    };
}

function normOf(shape: ToolShape): Norm {
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
const toolTypes: ToolType[] = ["brush", "sculpt"];
const toolMode: ToolMode[] = ["relative", "absolute"];

export const isActive = store(false);
export const activeTool = store<ToolType>("brush");
export const sensitivity = store(3);
export const sculptMode = store<ToolMode>("relative");
export const toolWidth = store(40);
const toolLengthInput = store(8);
const squareAspectRatio = store(true);
export const toolLength = compute(toolWidth, toolLengthInput, squareAspectRatio, (w, l, s) => s ? w : l);
export const toolRotation = store(0);

const brushIsValley = store(false);

const baseProfile = store(cubic3);
const toolShape = store<ToolShape>("circle");
export const toolNorm = compute(toolShape, normOf);
const profileModifier = store(unmodified);
const profileParameter = store(50);

const apply = (profile: ProfileFun1D, isValley: boolean = false, modifier: ProfileModifier = unmodified, parameter: number = 0) => {
    if (profile !== constant) profile = modifier(profile, parameter / 100);
    return isValley ? inverted(profile) : profile;
}

export const profileFun = compute(baseProfile, compute(brushIsValley, activeTool, (v, d) => v && d !== "sculpt"), toolNorm, profileModifier, profileParameter, (f, v, s, m, p) => toFun2D(apply(f, v, m, p), s));

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
                        onClick: () => activeTool.set(type),
                        isPressed: compute(activeTool, val => val === type),
                    })),
                }),
            ],
        }),
        groupbox({
            text: "Tool settings: TODO",
            content: [
                horizontal({
                    content: [
                        ...toolMode.map(mode => button({
                            ...imageOf(mode as "relative" | "absolute"),
                            tooltip: tooltipOf(mode),
                            onClick: () => sculptMode.set(mode),
                            isPressed: compute(sculptMode, val => val === mode),
                        })),
                        button({
                            height: 20,
                            text: "plateau",
                            onClick: () => sculptMode.set("plateau"),
                            isPressed: compute(sculptMode, val => val === "plateau"),
                        }),
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
            ],
        }),
        groupbox({
            text: "Mountain shape",
            content: [
                horizontal({
                    content: [constant, linear, gauss, circle].map(
                        profile => button({
                            width: 44,
                            height: 24,
                            image: compute(brushIsValley, isValley => createProfileImage(apply(profile, isValley))),
                            onClick: () => baseProfile.set(profile),
                            isPressed: compute(baseProfile, active => active === profile),
                            tooltip: tooltipOf(profile),
                        }),
                    ),
                }),
                horizontal({
                    content: [cubic1, cubic2, cubic3, cubic4, cubic5].map(
                        profile => button({
                            width: 44,
                            height: 24,
                            image: compute(brushIsValley, isValley => createProfileImage(apply(profile, isValley))),
                            onClick: () => baseProfile.set(profile),
                            isPressed: compute(baseProfile, active => active === profile),
                            tooltip: tooltipOf(profile),
                        }),
                    ),
                }),
            ],
        }),
        groupbox({
            text: "Shape modifications",
            disabled: compute(baseProfile, active => active === constant),
            content: [
                horizontal({
                    content: [mesa1, mesa2, crater].map(
                        modifier => button({
                            width: 44,
                            height: 24,
                            disabled: compute(baseProfile, active => active === constant),
                            image: compute(baseProfile, brushIsValley, profileParameter, (profile, isValley, parameter) => createProfileImage(apply(profile, isValley, modifier, parameter))),
                            onClick: () => profileModifier.set(profileModifier.get() === modifier ? unmodified : modifier),
                            isPressed: compute(profileModifier, active => active === modifier),
                            tooltip: tooltipOf(modifier),
                        }),
                    ).concat(
                        vertical({
                            height: 24,
                            padding: { left: "0.25w", },
                            content: [
                                spinner({
                                    padding: ["1w", 0],
                                    disabled: compute(baseProfile, active => active === constant),
                                    minimum: 0,
                                    maximum: 100,
                                    step: 5,
                                    format: v => `${v}%`,
                                    value: twoway(profileParameter),
                                }),
                            ],
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
