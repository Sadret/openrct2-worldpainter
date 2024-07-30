/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

const images = {
    brush: createImage("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAIAAAB02dgaAAAAB3RJTUUH6AcSCxUZIXjRfgAAAAlwSFlzAAALEgAACxIB0t1+/AAAAARnQU1BAACxjwv8YQUAAAAGdFJOUwCjAJMAf2bOiNMAAAKFSURBVHja7ZktTMNAFMdvZGICMTmBQCARJCAQiMklVE5MTEwgJiYqKkkoCXKiCQgEggQEYrIkCMQEEoFEICYQFYjJCRL4w4XLuF4/3msvI2QvC2mOvY/fvXu9u7fK1emR+C+ysugAypSqevIvQ6qy33NKD6hIGFVl4uk8Ipno+lMhyofZbDxf+3WSSj84a+0OBG+Zvb7M3IFot7zSSSAwC+NwwdClwUiMx7dBs3tgg0QKjMPFVr9hF2Zto7a312Asa6rAxWGTrEVeZu1OhOp6n4SWkGAWxuECjqzD2EMqgpEGI2sjsxDhFYuhFB65rtIxMqNaMSrIEpeFyHi3PE6rTs/DBw/a+L5pPFNyRlWRxxlMTOhNhkEt6TU1vr7w3BleAJoPTQVR+q77ZTAIvv7OPR+5bkWI4yD4mBvfqb9TXcSjOgmF3GcqpLOZ8mfEkOFqISo8YGybxpOQ0jGMQoNR/ozZ0GY9T2ZEcpYYWxkHJnN2U8ZJ2aMKrRA1987v2VWz7iRkxknIjBPLHg+JnJmyZp1qxwpMPJR4ZgSrZhaQmZxZWtbMsmaKwMRDEcuasVEzHBgc5OZbGTZOAJoLKzDqoD66aZyMhYZUSs2kuMgLI02kKBvvG0Yk9qk5p4t4VPfR5NepWbWa4srp1yajM8abiupl/vv9YCZh9H0G/253oBxCGQIFaj8NgkDDy+H3gz5+axrPlJxRVVOUMwVXjoeHyO+V0HbCrOPYv7ujX85IUTEbGjYaaOxbOh/Gdh+wCBINBoXoDNettjMVEhzBnUUY2x1AKewGGqdmJNLobmiDBGbZfcCfnzR6Tj84I2mu1muk7+c3i32DpCI3GVHwoPnX5F/9DPgJK0MNyF173g0AAAAASUVORK5CYII="),
    sculpt: createImage("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAIAAAB02dgaAAAAB3RJTUUH6AcSCxUz+sMYqAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAARnQU1BAACxjwv8YQUAAAAGdFJOUwCjAJMAf2bOiNMAAAI0SURBVHja5ZghT8NAFMdbaMgUWVDICUIQhBC2kMlJQqoIAoFAICoQ/QRbcQhEE8wEYgl8hM0hkBOEICcmJgiZRJGKJfDWS2+XXu/ddR3tMf5pluvLXfZ+9++969V8uGsZy6KVohP4ZzBepwvXn4cBhsmo+9YewwUNKZKmMBTj9GxMItCQImkHw2OwwpE0gsExVJC0gFHHwJGsokFmmc098GkcaART3xk5/uy2P6jAlCP9HT9IjKeAefm0PNeFhuf7tfKEjbdc1+Ti6jqqX7G3/YF8V4kNSQFDMOww3SlMhAS/rTB+7fvfTHw+pOySwJBZt6MUa+VpsNu5pS4BRrU8qXLxQpCEMNSN2KwbYdtmnDGZPrx7eSIlwLAPVU0868SlXhhn14zIvbxhEtcGMuuGYM2I3PttJJOcZ9JWKtGsL6TiwSYIxRrvk1jNTPZwxqbCO2MInDGV++TkDCtkdhfiHi/omRGD/O8yOqPbmpHm7V3YfNCiNsWKrxFVpIz7jMFUvGpUuKXC3832nU3MGVb5rxneGSkM5gyrmEsZ9xm67eYgYRmhSCq7O/6WkJskNRES6gnWErJm8sdQgqFIad/NCpGpw+dZvhanrWakHmhxbJZmj3emp2gtvs40rPH7MJhvLAwsDUukvXpy3CiaxajsHXx8HbZvXne3g/UN1YcFMJpNa23LgeEawaRF4jG0g1FBEmFoCiNCwjGItCjNuJ4f7+G3cX4p7alLaUakgkGkRWlelH4Aqj94vTMAGRYAAAAASUVORK5CYII="),
    special: createImage("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAIAAAB02dgaAAAAB3RJTUUH6AcSCxUZIXjRfgAAAAlwSFlzAAALEgAACxIB0t1+/AAAAARnQU1BAACxjwv8YQUAAAAGdFJOUwCjAJMAf2bOiNMAAAKFSURBVHja7ZktTMNAFMdvZGICMTmBQCARJCAQiMklVE5MTEwgJiYqKkkoCXKiCQgEggQEYrIkCMQEEoFEICYQFYjJCRL4w4XLuF4/3msvI2QvC2mOvY/fvXu9u7fK1emR+C+ysugAypSqevIvQ6qy33NKD6hIGFVl4uk8Ipno+lMhyofZbDxf+3WSSj84a+0OBG+Zvb7M3IFot7zSSSAwC+NwwdClwUiMx7dBs3tgg0QKjMPFVr9hF2Zto7a312Asa6rAxWGTrEVeZu1OhOp6n4SWkGAWxuECjqzD2EMqgpEGI2sjsxDhFYuhFB65rtIxMqNaMSrIEpeFyHi3PE6rTs/DBw/a+L5pPFNyRlWRxxlMTOhNhkEt6TU1vr7w3BleAJoPTQVR+q77ZTAIvv7OPR+5bkWI4yD4mBvfqb9TXcSjOgmF3GcqpLOZ8mfEkOFqISo8YGybxpOQ0jGMQoNR/ozZ0GY9T2ZEcpYYWxkHJnN2U8ZJ2aMKrRA1987v2VWz7iRkxknIjBPLHg+JnJmyZp1qxwpMPJR4ZgSrZhaQmZxZWtbMsmaKwMRDEcuasVEzHBgc5OZbGTZOAJoLKzDqoD66aZyMhYZUSs2kuMgLI02kKBvvG0Yk9qk5p4t4VPfR5NepWbWa4srp1yajM8abiupl/vv9YCZh9H0G/253oBxCGQIFaj8NgkDDy+H3gz5+axrPlJxRVVOUMwVXjoeHyO+V0HbCrOPYv7ujX85IUTEbGjYaaOxbOh/Gdh+wCBINBoXoDNettjMVEhzBnUUY2x1AKewGGqdmJNLobmiDBGbZfcCfnzR6Tj84I2mu1muk7+c3i32DpCI3GVHwoPnX5F/9DPgJK0MNyF173g0AAAAASUVORK5CYII="),
    absolute: createImage("iVBORw0KGgoAAAANSUhEUgAAADQAAAAgCAIAAADSXcwxAAAAK3RFWHRDcmVhdGlvbiBUaW1lAERvIDE4IEp1bCAyMDI0IDIxOjU5OjI0ICswMTAwPXAU6QAAAAd0SU1FB+gHEhQFH5WjglcAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAAABnRSTlMAowCTAH9mzojTAAAA+0lEQVR42mNcPLmeYbACpoF2wKjjRh03mMCo40YdR2/AQgtDdUI04Owra24MIscBXXbhwgk41yDEgmz3UTla0VwGBEAuckAOmOMwXUah+6jmOFwuo8R9gzq3Usdx+IMNAsgIPCo4jhiXkec+LEUJGYnDwMACq1Mo9Db2cu7FC/JLTgiQkMDuQ6CLiS/5BiBDEB+5IyC3kgqIDLwBCzli3DeQ0UrQfQOc5vC7D1qU+CSUPPiyBcKmvByBGIK18MMK0NwHdDHLHQGE44Auo4qb0NxHrsYPMgwgxw3qogQacsCQBLp3oB0DBaCQ40FyHDCOISE5GADEZQyDPFoBX81m5bebt7sAAAAASUVORK5CYII="),
    relative: createImage("iVBORw0KGgoAAAANSUhEUgAAADQAAAAgCAIAAADSXcwxAAAAK3RFWHRDcmVhdGlvbiBUaW1lAERvIDE4IEp1bCAyMDI0IDIxOjU4OjQ2ICswMTAwg0JneQAAAAd0SU1FB+gHEhQFDBEdw4kAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAAABnRSTlMAowCTAH9mzojTAAABFklEQVR42uXWoQ7CMBAG4EImEcgJHgCBmNxDIPcAPMQ8D8EjYJE8BHICgUAgJxE8ALe0CQSacr277ppwQSwk677+R49N9rutybWm2oDRcatmCZ8cccDqupPIUsI4QZkwTlYmiROXSeJSlAwuRWwyuEQyGZy3gMufdlxcIDb43hJ1cJiGcnxjnFayj46LOgc0HxGX7oRycTQZIbxoHCezWF/hfXz4nqqqkRTaHkI4qL6/MNctS/8OQVw19fmAWl/hjx/f3D94K4ktZHhqyWF8mm396VP+zYV9bpSsN+3tcbTX/DliF0GOQ/M1WUFcXOcvHMhETB8+6o33hRlwWY8SlxwkCV5tjKshudkbDnpsk8yhrMxk3tYnS/V9ra73be0AAAAASUVORK5CYII="),
    plateau: createImage("iVBORw0KGgoAAAANSUhEUgAAADQAAAAgCAIAAADSXcwxAAAAK3RFWHRDcmVhdGlvbiBUaW1lAERvIDE4IEp1bCAyMDI0IDIxOjU4OjQ2ICswMTAwg0JneQAAAAd0SU1FB+gHEhQFDBEdw4kAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAAABnRSTlMAowCTAH9mzojTAAABFklEQVR42uXWoQ7CMBAG4EImEcgJHgCBmNxDIPcAPMQ8D8EjYJE8BHICgUAgJxE8ALe0CQSacr277ppwQSwk677+R49N9rutybWm2oDRcatmCZ8cccDqupPIUsI4QZkwTlYmiROXSeJSlAwuRWwyuEQyGZy3gMufdlxcIDb43hJ1cJiGcnxjnFayj46LOgc0HxGX7oRycTQZIbxoHCezWF/hfXz4nqqqkRTaHkI4qL6/MNctS/8OQVw19fmAWl/hjx/f3D94K4ktZHhqyWF8mm396VP+zYV9bpSsN+3tcbTX/DliF0GOQ/M1WUFcXOcvHMhETB8+6o33hRlwWY8SlxwkCV5tjKshudkbDnpsk8yhrMxk3tYnS/V9ra73be0AAAAASUVORK5CYII="),
    square: createImage("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAYAAAD7u09NAAAACXBIWXMAAAsSAAALEgHS3X78AAABEUlEQVR4nO3XWwqDMBCFYXc82YP7jQ8u4JT2obRg02jmckbyMFARa/LzIboAWObg3WDGwDeIGQQzyEItRNYV276/5vk7ej00IYQkTGiIcrDx6DChImpDSFQY9xAgF+MqYvtzzCAmVIQMijk6TxNELog4K6Z1TBNEFEVYnHcLIgYiRp4pWmGoRZQAMdQiauf1RVHMrUQUBTEpRYjhe0xqEWLw/65CqrKIkftRPENKgveUricvlL5NrEW07t+7z+4gSCjiyrfO6SBoiMkoQi0IbiJCPQg+FpZRhFkQJBVhHgQ/NsYqwi0IkohwD4IBMR4iwoKAVER4EDTERIigCQISEXRBQDbhCwDZhC8AZBO+AJDNA2S6y3FDiVwkAAAAAElFTkSuQmCC"),
    circle: createImage("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAYAAAD7u09NAAAACXBIWXMAAAsSAAALEgHS3X78AAABIklEQVR4nO2ZSwqEMBBEvXF7B+8bFx6ghpnFMAOGRPuTasmiwRBNwutHibgAWGbhy2DCwL8QEwgmkIXaENk27Mfxqff16PPQgBASMOEdl5/5tTHfet4DXFjH5WRcDO+nASLKjl4x5o5RYUDkhhFXDWiNa+udgXMDIoZGeGfMHTBDjdiNjOhZzwyIJDLCwhjqzNgNxykyZB3wPJUhxTEjwgwRIiO066syRAiN0O7X89ZJbYQ4zJsaUoKN8MgU0wxZB3fc4q3TlbyoGMNmhMXXcDcQPNQIlSElkRFuhkhyI1wzpCQyogXSJUPkAUaogaCycVYjzIDgIUaYA4HCGAYj3IAgqRHuQHABXMR/ljRAENTxdEBAVsMPALIafgCQ1fADgKxe4UnmPbbLZ4QAAAAASUVORK5CYII="),
    diamond: createImage("iVBORw0KGgoAAAANSUhEUgAAAEQAAAAlCAYAAAD7u09NAAAACXBIWXMAAAsSAAALEgHS3X78AAABCUlEQVR4nO2YXQ6DIBCEuTHcwfsuDxxgTPvQpImVAPuH3YdJJAbcjB+zaAKQQvh4EGbgG4gwBGFIuouIIARhSGIlJB8Hamtvva4l75fF+1fr9zRtRFYY0+D413pXxk0bkhWJWCVmZv6jCKkDY/YtA4dERIa0yJAUGdIiQ5JUV9n+HEKMXUWsy2RHXUVivitCiJmIu/nsWwYOieA4mZoSQoIZ0Xueywwpxt9C4hlCzohQIQQLb9yaCPEMIaH/FRpdSyRDyoZEiGYILZwDtIkYNYIlQ/IDiFgipCoTwNm1RDIkb0iEaIbUjYjoGbllhhTP/0PwJzIvAM5kXgCcybwAOJN5AXAm8wLgTCcI9Ose0w+2GAAAAABJRU5ErkJggg=="),
    size: createImage("iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsSAAALEgHS3X78AAAAJnRFWHRDcmVhdGlvbgBGciAxOSBKdWwgMjAyNCAxMzo1ODoyOCArMDEwMJ8teacAAABNSURBVHicY2iePp2BHMwAIt5//vwfGaMreo9FHkMClw3vCWkk2cZmHDa/RxND0YjN9GYcfJTAITtUm6mh8T0pTn1PbuC8HzoJgJxQBQCyt9zg8BITeAAAAABJRU5ErkJggg=="),
    rotation: createImage("iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsSAAALEgHS3X78AAAAJnRFWHRDcmVhdGlvbgBGciAxOSBKdWwgMjAyNCAxMzo1ODo1NCArMDEwMFJIGsoAAABOSURBVHicY2iePp2BHMyATfD958//kTFBjega3uMxAKsmfC5oxqURl5/eY9NISFMzFs2DVON7qByGRkKa3xMTqiRHBz5bsSUEstIpRRoBHRHDPJdWyUYAAAAASUVORK5CYII="),
    sensitivity: createImage("iVBORw0KGgoAAAANSUhEUgAAACgAAAAOCAYAAABdC15GAAAACXBIWXMAAAsSAAALEgHS3X78AAAAV0lEQVR4nGNonj6dYTBjhoF2QPOwcuD7z5//gzA1LXiPZiYhPsEQHGyOZCDGwIF0JAOxBmITf4+DTU1HDk0Hvh/MUfx+EDmueUgWM82DDDMMtAOah7oDAdcdVdF8hI6bAAAAAElFTkSuQmCC"),
};

function createImage(base64: string) {
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
        width: info.width,
        height: info.height,
        image: info.id,
    };
}

export function imageOf(name: keyof typeof images) {
    return images[name];
}
