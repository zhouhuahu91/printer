// This library converts basic string to nice lay out in svg
const receiptline = require("receiptline");
// Converts the SVG to a png buffer. Thermal printer only accepts png
const sharp = require("sharp");
// Function imports
const getTimeAndDate = require("./getTimeAndDate");
const euro = require("./euro");

// This functions accepts an orders and returns a receipt the form of a PNGBuffer
const createReceipt = async (order) => {
  const { formattedTime, formattedDate } = getTimeAndDate();
  // ***** RECEIPT STYLING *****
  let receipt = `{
"^^^^New Hong Kong

Havenstraat 13
2211EE Noordwijkerhout
0252 37 29 02
${formattedDate} ${formattedTime}

^^^${order.name}

-
${order.paid ? "^^^Betaald" : "^^^Niet betaald"} | ^^^17:00\n\n-
`;

  order.cart.forEach((item) => {
    // This part print the chinese name
    receipt += `
    |^^^${item.qwt} ${item.name.zh}`;

    // This part prints the sides after the item name if there are sides.
    if (item.selectedSidesForPrinter.length > 0) {
      item.selectedSidesForPrinter.forEach((side) => {
        receipt += `, ${side.name.zh} `;
      });
    }
    // This part prints the itemm in dutch beneeth the chinese name.
    receipt += `
    |${item.name.nl} | ${euro(item.price)}
`;
    // This part prints the options on it's own line
    if (item.selectedOptionsForPrinter.length > 0) {
      item.selectedOptionsForPrinter.forEach((option) => {
        receipt += `
        |^^^${item.qwt} ${option.name.zh}
        |${option.name.nl}
`;
      });
    }
  });
  receipt += `

-
inclusief 9% btw ${euro((order.total * 9) / 109)}|
^^^Totaal ${euro(order.total)}|
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
