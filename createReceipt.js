// This library converts basic string to nice lay out in svg
const receiptline = require("receiptline");
// Converts the SVG to a png buffer. Thermal printer only accepts png
const sharp = require("sharp");

// This functions accepts an orders and returns a receipt the form of a PNGBuffer
const createReceipt = async (order) => {
  // ***** RECEIPT STYLING *****
  const receipt = `{
"^^^^New Hong Kong

Havenstraat 13
2211EE Noordwijkerhout
0252 37 29 02

{text:nowrap}
-
^^^Duivenvoorde | ^^^17:00

-
{text:wrap}
|^^^^1x 火肉 饭 
Babi pangang met bami | €16,60

-
^^^Totaal: €16,60|
`;
  // ***** RECEIPT STYLING *****

  // converts the receipt into a SVG.
  const svg = receiptline.transform(receipt, {
    cpl: 46,
    encoding: "cp936",
    spacing: true,
  });

  // Converts the SVG to a PNG
  const svgBuffer = Buffer.from(svg);
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();
  return pngBuffer;
};

module.exports = createReceipt;
