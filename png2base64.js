import sharp from "sharp";
import clipboard from "clipboardy";

const file = `./images/${process.argv[2]}.png`;

if (!file)
    throw new Error("no file specified");

const str = (await sharp(file).png().toBuffer()).toString("base64");
console.log(str);

await clipboard.write(str);
console.log("Copied to clipboard.");
