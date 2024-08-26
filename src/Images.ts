/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import * as Profiles from "./Profiles";
import type { Fun1Num, ImageData, SpecialMode, ToolMode, ToolShape, ToolType } from "./types";
import { BrushDirection } from './types';

function createImageFromBase64(base64: string): ImageData {
    const range = ui.imageManager.allocate(1);
    if (!range) throw new Error("[WP] Cannot allocate image from image manager.");
    const id = range.start;
    ui.imageManager.setPixelData(id, {
        type: "png",
        palette: "closest",
        data: base64,
    });
    const info = ui.imageManager.getImageInfo(id);
    if (!info) throw new Error("[WP] Cannot get image info from image manager.");
    return {
        image: info.id,
        width: info.width,
        height: info.height,
    };
}

const g = 4, p = 2, eps = 1e-3;

// profile is [-1, 1] -> [0, 1]
function getDataForProfile(profile: Fun1Num, colour: number, imgW: number, imgH: number): Uint8Array {
    const cnvsW = (imgW >> 1) - p, cnvsH = imgH - 2 * p;
    const prflW = cnvsW - g, prflH = cnvsH - g;
    const data = new Uint8Array(imgH * imgW);

    // helper functions in profile coordinates
    function get(x: number, y: number): number {
        return data[(imgW / 2 + x) + imgW * (imgH - 1 - p - g - y)];
    }
    function set(x: number, y: number, c: number): void {
        data[(imgW / 2 + x) + imgW * (imgH - 1 - p - g - y)] = c;
    }
    function add(x: number, y: number, d: number): void {
        data[(imgW / 2 + x) + imgW * (imgH - 1 - p - g - y)] += d;
    }

    // ground
    for (let x = -cnvsW; x < cnvsW; x++)
        for (let y = -g; y < 0; y++)
            set(x, y, colour); // inner
    for (let x = -cnvsW; x < cnvsW; x++) {
        add(x, -g, -2); // bottom
        // add(x, -1, 2); // top
    }
    for (let y = -g; y < 0; y++) {
        add(-cnvsW, y, 2); // left
        add(cnvsW - 1, y, -2); // right
    }

    // profile
    for (let x = -prflW; x < prflW; x++) {
        let z = profile((x + 0.5) / prflW);
        for (let y = 0; (y + 0.5) / prflH <= z + eps; y++)
            set(x, y, colour); // inner
    }
    for (let x = -cnvsW; x < cnvsW; x++) {
        let y = prflH - 1;
        while (get(x, y) === 0) y--;
        add(x, y, 2); // top outline
        for (y--; get(x, y - 1) * get(x - 1, y) * get(x + 1, y) === 0 && y >= -1; y--)
            add(x, y, 2); // side outline
    }

    return data;
}

function blendData(front: Uint8Array, back: Uint8Array): Uint8Array {
    const result = new Uint8Array(front.length);
    for (let i = 0; i < front.length; i++)
        result[i] = front[i] || back[i];
    return result;
}

function createImageFromProfile(profile: Fun1Num, original: Fun1Num = () => 0, width: number = 44, height = (width >> 1) + p): ImageData {
    const range = ui.imageManager.allocate(1);
    if (!range) throw new Error("[WP] Cannot allocate image from image manager.");
    const data = blendData(getDataForProfile(original, 89, width, height), getDataForProfile(profile, 88, width, height));

    ui.imageManager.setPixelData(range.start, {
        type: "raw",
        width: width,
        height: height,
        data: data,
    });

    return {
        image: range.start,
        width: width,
        height: height,
    };
}

const shape: Fun1Num = x => Profiles.cubic_3(Math.abs(x)) * 2 / 3;

type ImageName = ToolShape | "size" | "link" | "rotation" | ToolType | ToolMode | "sensitivity" | "sensitivity_disabled" | BrushDirection | SpecialMode | keyof typeof Profiles;

export function createImage(name: ImageName): ImageData {
    switch (name) {
        // tool shapes
        case "square": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAYAAAD7u09NAAAACXBIWXMAAAsSAAALEgHS3X78AAABEUlEQVR4nO3XWwqDMBCFYXc82YP7jQ8u4JT2obRg02jmckbyMFARa/LzIboAWObg3WDGwDeIGQQzyEItRNYV276/5vk7ej00IYQkTGiIcrDx6DChImpDSFQY9xAgF+MqYvtzzCAmVIQMijk6TxNELog4K6Z1TBNEFEVYnHcLIgYiRp4pWmGoRZQAMdQiauf1RVHMrUQUBTEpRYjhe0xqEWLw/65CqrKIkftRPENKgveUricvlL5NrEW07t+7z+4gSCjiyrfO6SBoiMkoQi0IbiJCPQg+FpZRhFkQJBVhHgQ/NsYqwi0IkohwD4IBMR4iwoKAVER4EDTERIigCQISEXRBQDbhCwDZhC8AZBO+AJDNA2S6y3FDiVwkAAAAAElFTkSuQmCC");
        case "circle": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAYAAAD7u09NAAAACXBIWXMAAAsSAAALEgHS3X78AAABIklEQVR4nO2ZSwqEMBBEvXF7B+8bFx6ghpnFMAOGRPuTasmiwRBNwutHibgAWGbhy2DCwL8QEwgmkIXaENk27Mfxqff16PPQgBASMOEdl5/5tTHfet4DXFjH5WRcDO+nASLKjl4x5o5RYUDkhhFXDWiNa+udgXMDIoZGeGfMHTBDjdiNjOhZzwyIJDLCwhjqzNgNxykyZB3wPJUhxTEjwgwRIiO066syRAiN0O7X89ZJbYQ4zJsaUoKN8MgU0wxZB3fc4q3TlbyoGMNmhMXXcDcQPNQIlSElkRFuhkhyI1wzpCQyogXSJUPkAUaogaCycVYjzIDgIUaYA4HCGAYj3IAgqRHuQHABXMR/ljRAENTxdEBAVsMPALIafgCQ1fADgKxe4UnmPbbLZ4QAAAAASUVORK5CYII=");
        case "diamond": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAYAAAD7u09NAAAACXBIWXMAAAsSAAALEgHS3X78AAABCUlEQVR4nO2YXQ6DIBCEuTHcwfsuDxxgTPvQpImVAPuH3YdJJAbcjB+zaAKQQvh4EGbgG4gwBGFIuouIIARhSGIlJB8Hamtvva4l75fF+1fr9zRtRFYY0+D413pXxk0bkhWJWCVmZv6jCKkDY/YtA4dERIa0yJAUGdIiQ5JUV9n+HEKMXUWsy2RHXUVivitCiJmIu/nsWwYOieA4mZoSQoIZ0Xueywwpxt9C4hlCzohQIQQLb9yaCPEMIaH/FRpdSyRDyoZEiGYILZwDtIkYNYIlQ/IDiFgipCoTwNm1RDIkb0iEaIbUjYjoGbllhhTP/0PwJzIvAM5kXgCcybwAOJN5AXAm8wLgTCcI9Ose0w+2GAAAAABJRU5ErkJggg==");

        // tool size and rotation
        case "size": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsSAAALEgHS3X78AAAAJnRFWHRDcmVhdGlvbgBGciAxOSBKdWwgMjAyNCAxMzo1ODoyOCArMDEwMJ8teacAAABNSURBVHicY/j//z8DOZgBRDy/ffg/MkZX9ByLPIYELhueE9JIso3/cdj8HE0MRSM20//j4KMEDtmh+p8aGp+T4tTn5AbO86GTAMgJVQC4NW2v7MTPiQAAAABJRU5ErkJggg==");
        case "link": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAABUAAAAMCAYAAACNzvbFAAAACXBIWXMAAAsSAAALEgHS3X78AAAAaElEQVR4nGP4//8/A7UxA10MFVdW/o+OSZH/j24oSMH7z5//bz98GAXDNBKSxzBUHEkDNtfgwtgMZkA2FF2SGJdh08dAyND85mYMjE0NXkPzoQqIxdgsYkCPKHwuI8bl/+mSpAZ1jgIAmACDh9ix3AkAAAAASUVORK5CYII=");
        case "rotation": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsSAAALEgHS3X78AAAAJnRFWHRDcmVhdGlvbgBGciAxOSBKdWwgMjAyNCAxMzo1ODo1NCArMDEwMFJIGsoAAABPSURBVHicY/j//z8DOZgBm+Dz24f/I2OCGtE1PMdjAFZN+FzwH5dGXH56jk0jIU3/sWgepBqfQ+UwNBLS/JyYUCU5OvDZii0hkJVOKdIIAPnfZ1tDEES5AAAAAElFTkSuQmCC");

        // tool type
        case "brush": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAIAAAB02dgaAAAAB3RJTUUH6AcSCxUZIXjRfgAAAAlwSFlzAAALEgAACxIB0t1+/AAAAARnQU1BAACxjwv8YQUAAAAGdFJOUwCjAJMAf2bOiNMAAAKFSURBVHja7ZktTMNAFMdvZGICMTmBQCARJCAQiMklVE5MTEwgJiYqKkkoCXKiCQgEggQEYrIkCMQEEoFEICYQFYjJCRL4w4XLuF4/3msvI2QvC2mOvY/fvXu9u7fK1emR+C+ysugAypSqevIvQ6qy33NKD6hIGFVl4uk8Ipno+lMhyofZbDxf+3WSSj84a+0OBG+Zvb7M3IFot7zSSSAwC+NwwdClwUiMx7dBs3tgg0QKjMPFVr9hF2Zto7a312Asa6rAxWGTrEVeZu1OhOp6n4SWkGAWxuECjqzD2EMqgpEGI2sjsxDhFYuhFB65rtIxMqNaMSrIEpeFyHi3PE6rTs/DBw/a+L5pPFNyRlWRxxlMTOhNhkEt6TU1vr7w3BleAJoPTQVR+q77ZTAIvv7OPR+5bkWI4yD4mBvfqb9TXcSjOgmF3GcqpLOZ8mfEkOFqISo8YGybxpOQ0jGMQoNR/ozZ0GY9T2ZEcpYYWxkHJnN2U8ZJ2aMKrRA1987v2VWz7iRkxknIjBPLHg+JnJmyZp1qxwpMPJR4ZgSrZhaQmZxZWtbMsmaKwMRDEcuasVEzHBgc5OZbGTZOAJoLKzDqoD66aZyMhYZUSs2kuMgLI02kKBvvG0Yk9qk5p4t4VPfR5NepWbWa4srp1yajM8abiupl/vv9YCZh9H0G/253oBxCGQIFaj8NgkDDy+H3gz5+axrPlJxRVVOUMwVXjoeHyO+V0HbCrOPYv7ujX85IUTEbGjYaaOxbOh/Gdh+wCBINBoXoDNettjMVEhzBnUUY2x1AKewGGqdmJNLobmiDBGbZfcCfnzR6Tj84I2mu1muk7+c3i32DpCI3GVHwoPnX5F/9DPgJK0MNyF173g0AAAAASUVORK5CYII=");
        case "sculpt": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAIAAAB02dgaAAAAB3RJTUUH6AcSCxUz+sMYqAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAARnQU1BAACxjwv8YQUAAAAGdFJOUwCjAJMAf2bOiNMAAAI0SURBVHja5ZghT8NAFMdbaMgUWVDICUIQhBC2kMlJQqoIAoFAICoQ/QRbcQhEE8wEYgl8hM0hkBOEICcmJgiZRJGKJfDWS2+XXu/ddR3tMf5pluvLXfZ+9++969V8uGsZy6KVohP4ZzBepwvXn4cBhsmo+9YewwUNKZKmMBTj9GxMItCQImkHw2OwwpE0gsExVJC0gFHHwJGsokFmmc098GkcaART3xk5/uy2P6jAlCP9HT9IjKeAefm0PNeFhuf7tfKEjbdc1+Ti6jqqX7G3/YF8V4kNSQFDMOww3SlMhAS/rTB+7fvfTHw+pOySwJBZt6MUa+VpsNu5pS4BRrU8qXLxQpCEMNSN2KwbYdtmnDGZPrx7eSIlwLAPVU0868SlXhhn14zIvbxhEtcGMuuGYM2I3PttJJOcZ9JWKtGsL6TiwSYIxRrvk1jNTPZwxqbCO2MInDGV++TkDCtkdhfiHi/omRGD/O8yOqPbmpHm7V3YfNCiNsWKrxFVpIz7jMFUvGpUuKXC3832nU3MGVb5rxneGSkM5gyrmEsZ9xm67eYgYRmhSCq7O/6WkJskNRES6gnWErJm8sdQgqFIad/NCpGpw+dZvhanrWakHmhxbJZmj3emp2gtvs40rPH7MJhvLAwsDUukvXpy3CiaxajsHXx8HbZvXne3g/UN1YcFMJpNa23LgeEawaRF4jG0g1FBEmFoCiNCwjGItCjNuJ4f7+G3cX4p7alLaUakgkGkRWlelH4Aqj94vTMAGRYAAAAASUVORK5CYII=");
        case "special": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAYAAAD7u09NAAAACXBIWXMAAAsSAAALEgHS3X78AAABS0lEQVR4nO2XzQ2DMAyF2YNjR+DQgTpAugPjdRc4ZIBXtaJVFIXE+XdCDk8COQj78yMxE4BpCH8GAwY6AyJfM1Ks6QYIIgFcAggi4HQPQx7qFojUinMVq8YpYC7nAPQMBB57BHVd9YLATMEPinXFLuVXn2tTfLPEczmhOBChgTDd/0A8DXHuYLxAbA5H7AoIX0el0uM+47YsCDmRSECEVmisQ1KBOStOBRJyIpE/DQTEYxxlA2AqTr22QXFBdYIQmR2ir491iA0IRcU6LgqfSjqU4DlEMHaIrSg9FuqSZvYQJHAJBWxTDkEiIN3tIfLoMOXU8IXSjUPkyZwRDQQN7yG+c4kXEDCfVH2UFAgSdTwnCMqMQYXS3N8uMrsk+AWi8ORZCkr1JDGAgDWU6l3DAALWUKonhwEErFU9ATBT9QTATNUTADNVTwDM9AY5D1YRBFP0tQAAAABJRU5ErkJggg==");

        // tool mode
        case "relative": return createImageFromProfile(x => shape(x) + Number(x < 0) / 3, x => Number(x < 0) / 3, 68, 51);
        case "absolute": return createImageFromProfile(x => Math.max(shape(x), Number(x < 0) / 3), x => Number(x < 0) / 3, 68, 51);
        case "plateau": return createImageFromProfile(x => Math.min(shape(x), 1 / 3), x => Number(x < 0) / 3, 68, 51);

        // brush settings
        case "sensitivity": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAACgAAAAOCAYAAABdC15GAAAACXBIWXMAAAsSAAALEgHS3X78AAAAV0lEQVR4nN3UwQkAIAwDwOy/lmM4QMaI+BWlPoSmPgLqIx4VhCQ4B9kAfQVkb5p5eQGXzmgfTtANiZvCTCRuC3fnPKxfImsC6fzENMKp5DcjsyAboOrAATKasd/4meGdAAAAAElFTkSuQmCC");
        case "sensitivity_disabled": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAACgAAAAOCAYAAABdC15GAAAACXBIWXMAAAsSAAALEgHS3X78AAAAVklEQVR4nN3UMQoAIAwDwPzPh/iIPD7iKkodhKYOAXWIRwUhCc5BNkBfAdmbZl5ewKUz2ocTdEPipjATidvC3TkP65fImkA6PzGNcCr5zcgsyAaoOnAABidLv1VGf/kAAAAASUVORK5CYII=");
        case "up": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAADAAAAAOCAYAAABpcp9aAAAACXBIWXMAAAsSAAALEgHS3X78AAAAvUlEQVR4nGP4//8/w1DGDCPaA4dvT/4PwrR0oLKxMV7zKXL4/O35YEwLjygbG/+fX2z8//NpaTCNyyNkOR7mcHRMDU8oIzkcHWPzCNUcT6knlPE4HJ9HqOp4SjyhbEyc42E4OlqYeA+Q4nhyPREdLfwfhnF5BlkN0R4gx/HUSE6f8YQ61jxw//t+eGmCjMl1PHoJhW4m1T1wmAqOJRbnt/uPeuA/egzAQoYe2DvZnGAMRKNlWOSMS3Y9MBgxAOfWeGGL72g7AAAAAElFTkSuQmCC");
        case "down": return createImageFromBase64("iVBORw0KGgoAAAANSUhEUgAAADAAAAAOCAYAAABpcp9aAAAACXBIWXMAAAsSAAALEgHS3X78AAAAy0lEQVR4nGP4//8/w1DGDMPGA/e/7/9/+PZkDEypBdjMnL89H6+5ysbG/3FhnB6AGYyOKfEELjPz2/0JeuDzaWkMTJYHyPUEPvPo7oH5JHqCkFkD4oH5RHqCGHMGzAPzCXiCWDOweUAZLbPi8gB6hibZcpgnkD2CXLpQ4oHPWByNC0dHC5PvAXSPkKoPmweSzaX/X18uTJTjQepA6in2ALkYXx5IxuMRZIeTnQdo7YH/WDyCzeEYHoAZTA/snWxOdJGcjMPhGB4YqhgA3+FpNWtOt7cAAAAASUVORK5CYII=");

        // special modes
        case "smooth": return createImageFromProfile(x => Math.ceil(x) / 2 + 0.5 - Math.abs(0.5 - Math.abs(x)), x => Math.round(x + 1) / 2, 68);
        case "flat": return createImageFromProfile(x => Math.ceil(Math.min(1, x + 1, 1.5 - x) * 2) / 2, x => Math.min(1, x + 1, 1.5 - x), 68);
        case "rough": return createImageFromProfile(x => (x < -0.5 || x > 0) ? Math.abs(x) % 0.5 : 0.5, () => 0, 68);

        // profiles
        default: return createImageFromProfile(x => Profiles[name](Math.abs(x)));
    }
}