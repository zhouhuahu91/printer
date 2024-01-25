// Imports from for the printer to connect to Epson printer
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
// This library converts basic string to nice lay out in svg
const receiptline = require("receiptline");
// Converts the SVG to a png buffer. Thermal printer only accepts png
const sharp = require("sharp");

// Markup for the receipt
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

// converts the receipt into a SVG.
const svg = receiptline.transform(receipt, {
  cpl: 46,
  encoding: "cp936",
  spacing: true,
});

// Initializes the printer.
let printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: "/dev/usb/lp0",
});

const print = async () => {
  // Converts the SVG to a PNG
  const svgBuffer = Buffer.from(svg);
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();

  // Print the PNG.
  await printer.printImageBuffer(pngBuffer);
  printer.cut();

  printer.execute();
};

print();
