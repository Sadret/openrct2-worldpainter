/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { button, checkbox, compute, dropdown, groupbox, horizontal, label, spinner, store, twoway, window } from "openrct2-flexui";
import { DragMode, ProfileFun1D, ProfileFun2D, ProfileModifier } from './types';
import { linear, createProfileImage, constant, gauss, circle, cubic, invCircle, quadratic, invQuadratic, toEuclidean, toSupremum, toManhattan, createShapeImage, unmodified, crater, mesa2, capped, mesa } from './profiles';

export const isActive = store(false);
const selectedDragMode = store(1);
export const dragMode = compute<number, DragMode>(selectedDragMode, i => (["none", "apply", "move"] satisfies DragMode[])[i]);
export const sensitivity = store(3);
export const brushWidth = store(40);
const brushLengthInput = store(8);
const squareAspectRatio = store(true);
export const brushLength = compute(brushWidth, brushLengthInput, squareAspectRatio, (w, l, s) => s ? w : l);

const baseProfile = store<ProfileFun1D>(constant);
const brushShape = store<(f: ProfileFun1D) => ProfileFun2D>(toEuclidean);
const profileModifier = store<ProfileModifier>(unmodified);
const profileParameter = store(50);
export const profileFun = compute(baseProfile, brushShape, profileModifier, profileParameter, (f, s, m, p) => s(f === constant ? f : m(f, p / 100)));

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
        groupbox({
            text: "Basic profile",
            content: [
                horizontal({
                    content: [constant, linear, quadratic, cubic, gauss, circle, invQuadratic, invCircle].map(
                        profile => button({
                            width: 40,
                            height: 40,
                            image: createProfileImage(profile),
                            onClick: () => baseProfile.set(profile),
                            isPressed: compute(baseProfile, active => active === profile),
                            tooltip: "hello",
                        }),
                    ),
                }),
            ],
        }),
        horizontal({
            content: [
                groupbox({
                    text: "Brush shape",
                    content: [
                        horizontal({
                            content: [toSupremum, toEuclidean, toManhattan].map(
                                shape => button({
                                    width: 40,
                                    height: 40,
                                    image: createShapeImage(shape),
                                    onClick: () => brushShape.set(shape),
                                    isPressed: compute(brushShape, active => active === shape),
                                    tooltip: "hello",
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
                            content: [unmodified, crater, mesa, mesa2, capped].map(
                                modifier => button({
                                    width: 40,
                                    height: 40,
                                    disabled: compute(baseProfile, active => active === constant),
                                    image: compute(baseProfile, profileParameter, (profile, param) => createProfileImage(profile === constant ? constant : modifier(profile, param / 100))),
                                    onClick: () => profileModifier.set(modifier),
                                    isPressed: compute(profileModifier, active => active === modifier),
                                    tooltip: "hello",
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