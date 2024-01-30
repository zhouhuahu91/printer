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

  const capitalize = (str) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  // ***** RECEIPT STYLING *****
  let receipt = `{
"^^^^New Hong Kong

Havenstraat 13
2211EE Noordwijkerhout
0252 37 29 02
${formattedDate} ${formattedTime}

^^^${capitalize(order.name)}
|${order.remarks && `^^^# ${order.remarks}`}

-
^^^${order.time}

-`;

  order.cart.forEach((item) => {
    // This part print the chinese name
    receipt += `

    |^^^^${item.qwt} ${item.name.zh}`;

    // template to hold sides
    const sidesCount = {};
    const sidesCountDutch = {};
    // This part prints the sides after the item name if there are sides.
    if (item.selectedSidesForPrinter.length > 0) {
      item.selectedSidesForPrinter.forEach((side) => {
        // Check if name is in template
        if (sidesCount[side.name.zh]) {
          // If name is in template we add 1
          sidesCount[side.name.zh]++;
        } else {
          // If not we set the name to one
          sidesCount[side.name.zh] = 1;
          sidesCountDutch[side.name.zh] = side.name.nl;
        }
      });
      // If there are sides we add this after the main item
      receipt += ",";
      // We print the sides next to it.
      // Sides gets multiplied by the main item.
      for (const side in sidesCount) {
        const sideQwt = sidesCount[side] * item.qwt;
        // if there is only one side no need to show 1.
        if (sideQwt > 1) {
          receipt += ` ${sideQwt}`;
        }
        receipt += ` ${side}`;
      }
    }
    // This part prints the itemm in dutch beneeth the chinese name.
    receipt += `
    {w:*,10}
    |${item.name.nl}`;

    // And behind the dutch name we also want to print out the sides that was chosen.
    // If there are any of course.
    if (item.selectedSidesForPrinter.length > 0) {
      receipt += ",";

      for (const side in sidesCount) {
        const sideQwtDutch = sidesCount[side] * item.qwt;
        // if there is only one side no need to show 1.
        if (sideQwtDutch > 1) {
          receipt += ` ${sideQwtDutch}`;
        }
        receipt += ` ${sidesCountDutch[side]}`;
      }
    }

    receipt += ` | ${euro(item.price)}
    {w:auto}`;

    // This part prints the options on it's own line
    // If the option is main we don't need to prin the options
    if (item.selectedOptionsForPrinter.length > 0 && !item.optionIsMain) {
      // template to hold options
      const optionsCount = {};
      // We need to know what to print in dutch
      const optionsCountDutch = {};
      item.selectedOptionsForPrinter.forEach((option) => {
        // Check if name is in template
        if (optionsCount[option.name.zh]) {
          // If name is in template we add 1
          optionsCount[option.name.zh]++;
        } else {
          // If not we set the name to one
          optionsCount[option.name.zh] = 1;
          // We connect the dutch translation to it.
          optionsCountDutch[option.name.zh] = option.name.nl;
        }
      });
      // We print the options.
      // Options gets multiplied by the main item.
      for (const option in optionsCount) {
        receipt += `
        |^^^^${optionsCount[option] * item.qwt} (${option})
        |${optionsCountDutch[option]}`;
      }
    }
  });

  // adds the total of all the items in the cart.
  receipt += `

-

Subtotaal ${euro(order.cart.reduce((x, y) => x + y.price, 0))}|`;

  // adds delivery cost of order is for delivery
  if (order.delivery) {
    receipt += `
Bezorgkosten ${euro(order.storeFees.deliveryFee)}|`;
  }

  // adds fee for the bag if order.bag is true but only if order isn't for delivery bag fee is included in the delivery fee
  if (order.paymentMethod === "online") {
    receipt += `
Transactiekosten ${euro(order.storeFees.transactionFee)}|`;
  }

  // adds fee for the bag if order.bag is true but only if order isn't for delivery bag fee is included in the delivery fee
  if (!order.delivery && order.bag) {
    receipt += `
Tasje ${euro(order.storeFees.plasticBagFee)}|`;
  }

  //  adds tip if customer gave a tip
  if (order.tip > 0) {
    receipt += `
Fooi ${euro(order.tip)}|`;
  }

  receipt += `

-
^^^Totaal ${euro(order.total)}|

^^^${order.paid ? "BETAALD" : "NIET BETAALD"}
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
