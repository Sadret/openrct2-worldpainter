/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { button, checkbox, compute, dropdown, groupbox, horizontal, label, spinner, store, twoway, window } from "openrct2-flexui";
import { DragMode, ProfileFun1D, ProfileModifier } from './types';
import { linear, createProfileImage, constant, gauss, circle, euclidean, supremum, manhattan, createShapeImage, unmodified, crater, mesa1, mesa2, toFun2D, inverted, cubic3, cubic1, cubic4, cubic2, cubic5 } from './profiles';

function tooltipOf(obj: any): string {
    switch (obj) {
        // isValley
        case false: return "Raise";
        case true: return "Lower";
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
        // brushNorm
        case supremum: return "Square";
        case euclidean: return "Circle";
        case manhattan: return "Diamond";
        // brushModifer
        case unmodified: return "Unmodified";
        case mesa1: return "Mesa 1";
        case mesa2: return "Mesa 2";
        case crater: return "Crater";
        // default
        default: return "(unknown)";
    };
}

export const isActive = store(false);
const selectedDragMode = store(1);
export const dragMode = compute<number, DragMode>(selectedDragMode, i => (["none", "apply", "move"] satisfies DragMode[])[i]);
export const sensitivity = store(3);
export const brushWidth = store(40);
const brushLengthInput = store(8);
const squareAspectRatio = store(true);
export const brushLength = compute(brushWidth, brushLengthInput, squareAspectRatio, (w, l, s) => s ? w : l);

const brushIsValley = store(false);

const baseProfile = store(constant);
export const brushNorm = store(euclidean);
const profileModifier = store(unmodified);
const profileParameter = store(50);

const apply = (profile: ProfileFun1D, isValley: boolean = false, modifier: ProfileModifier = unmodified, parameter: number = 0) => {
    if (profile !== constant) profile = modifier(profile, parameter / 100);
    return isValley ? inverted(profile) : profile;
}

export const profileFun = compute(baseProfile, compute(brushIsValley, dragMode, (v, d) => v && d !== "apply"), brushNorm, profileModifier, profileParameter, (f, v, s, m, p) => toFun2D(apply(f, v, m, p), s));

const win = window({
    title: "WorldPainter",
    width: 384,
    height: "auto",
    content: [
        groupbox({
            text: "General settings",
            content: [
                horizontal({
                    content: [
                        label({
                            text: "Drag mode:",
                        }),
                        dropdown({
                            items: [
                                "click to apply",
                                "click and drag to apply",
                                "click to apply, drag to move",
                            ],
                            selectedIndex: twoway(selectedDragMode),
                            width: "2w",
                        }),
                    ],
                }),
                horizontal({
                    content: [
                        label({
                            text: "Sensitivity:",
                        }),
                        spinner({
                            minimum: 0,
                            maximum: 10,
                            value: twoway(sensitivity),
                            width: "2w",
                        }),
                    ],
                }),
            ],
        }),
        groupbox({
            text: "Brush settings",
            content: [
                horizontal({
                    content: [
                        label({
                            text: "Width:",
                            width: "2w",
                        }),
                        spinner({
                            minimum: 2,
                            value: twoway(brushWidth),
                            width: "2w",
                        }),
                        label({ text: "", width: "0.5w", }),
                        button({
                            text: "<->",
                            onClick: () => {
                                const width = brushWidth.get();
                                brushWidth.set(brushLengthInput.get());
                                brushLengthInput.set(width);
                            },
                            height: 14,
                            width: "1w",
                            disabled: squareAspectRatio,
                        }),
                        label({ text: "", width: "0.5w", }),
                        label({
                            text: "Length:",
                            disabled: squareAspectRatio,
                            width: "2w",
                        }),
                        spinner({
                            minimum: 2,
                            value: twoway(brushLengthInput),
                            width: "2w",
                            disabled: squareAspectRatio,
                        }),
                        label({ text: "", width: "0.5w", }),
                        checkbox({
                            text: "1:1",
                            isChecked: twoway(squareAspectRatio),
                            width: "1w",
                        }),
                    ],
                }),
            ],
        }),
        horizontal({
            content: [
                groupbox({
                    text: "Brush direction",
                    content: [
                        horizontal({
                            content: [false, true].map(
                                val => button({
                                    width: 24,
                                    height: 24,
                                    image: 5147 - Number(val) * 2,
                                    onClick: () => brushIsValley.set(val),
                                    isPressed: compute(brushIsValley, active => active === val),
                                    tooltip: tooltipOf(val),
                                }),
                            ),
                        }),
                    ],
                }),
                groupbox({
                    text: "Basic profile",
                    content: [
                        horizontal({
                            content: [constant, linear, gauss, circle].map(
                                profile => button({
                                    width: 40,
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
                                    width: 40,
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
            ],
        }),
        horizontal({
            content: [
                groupbox({
                    text: "Brush shape",
                    content: [
                        horizontal({
                            content: [supremum, euclidean, manhattan].map(
                                shape => button({
                                    width: 40,
                                    height: 40,
                                    image: createShapeImage(shape),
                                    onClick: () => brushNorm.set(shape),
                                    isPressed: compute(brushNorm, active => active === shape),
                                    tooltip: tooltipOf(shape),
                                }),
                            ),
                        }),
                    ],
                }),
                groupbox({
                    text: "Profile modifier",
                    disabled: compute(baseProfile, active => active === constant),
                    content: [
                        horizontal({
                            content: [unmodified, mesa1, mesa2, crater].map(
                                modifier => button({
                                    width: 40,
                                    height: 24,
                                    disabled: compute(baseProfile, active => active === constant),
                                    image: compute(baseProfile, brushIsValley, profileParameter, (profile, isValley, parameter) => createProfileImage(apply(profile, isValley, modifier, parameter))),
                                    onClick: () => profileModifier.set(modifier),
                                    isPressed: compute(profileModifier, active => active === modifier),
                                    tooltip: tooltipOf(modifier),
                                }),
                            ),
                        }),
                        horizontal({
                            content: [
                                label({
                                    text: "Parameter:",
                                    disabled: compute(baseProfile, active => active === constant),
                                }),
                                spinner({
                                    disabled: compute(baseProfile, active => active === constant),
                                    minimum: 0,
                                    maximum: 100,
                                    step: 5,
                                    format: to2Decimals,
                                    value: twoway(profileParameter),
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    ],
    onOpen: () => isActive.set(true),
    onClose: () => isActive.set(false),
});
isActive.subscribe(value => value ? win.open() : win.close());

export function open(): void {
    win.open();
}

export function close(): void {
    win.close();
}

function to2Decimals(value: number): string {
    let str = String(value / 100);
    if (str.length < 2) str += ".";
    while (str.length < 4) str += "0";
    return str;
}