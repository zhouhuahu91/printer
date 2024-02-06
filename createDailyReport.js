// This library converts basic string to nice lay out in svg
const receiptline = require("receiptline");
// Converts the SVG to a png buffer. Thermal printer only accepts png
const sharp = require("sharp");
// Function imports
const euro = require("./euro");
const calculateVat = require("./calculateVat");

const createDailyReport = async (data) => {
  // Total revenue
  const revenue = data.reduce((x, y) => x + y.total, 0);
  // Total online payments
  const onlinePayments = {};
  data.forEach((order) => {
    if (order.paymentMethod === "online") {
      if (onlinePayments[`${order.paymentMethodType}`] > 0) {
        onlinePayments[`${order.paymentMethodType}`] += order.total;
      } else {
        onlinePayments[`${order.paymentMethodType}`] = order.total;
      }
    }
  });

  // Total card payments in store, online payment is also set to card if they pay with credit card. Didn't know stripe did this.
  const cardPayments = data.reduce((x, y) => {
    if (y.paymentMethod === "in_person" && y.paymentMethodType === "card") {
      return x + y.total;
    } else {
      return x;
    }
  }, 0);

  // This one is easier we just need to check paymentMethodType if that one is cash or not but we do it just in case.
  const cashPayments = data.reduce((x, y) => {
    if (y.paymentMethod === "in_person" && y.paymentMethodType === "cash") {
      return x + y.total;
    } else {
      return x;
    }
  }, 0);

  const vat = data.reduce(
    (x, y) => {
      // z returns the vat of the current order
      const z = calculateVat(y);
      // We add the vat of current order with the vat that is store in x.
      return {
        low: x.low + z.low,
        high: x.high + z.high,
        zero: x.zero + z.zero,
      };
    },
    { low: 0, high: 0, zero: 0 }
  );

  const lowBTW = Math.round((vat.low / 109) * 9);
  const highBTW = Math.round((vat.high / 121) * 21);

  let markup = `
    "^^^^New Hong Kong

    Havenstraat 13  
    2211EE Noordwijkerhout
    0252 37 29 02
    info@newhongkong.nl

    -
    dagrapport | ${date}
    -

    "afhaal     | "omzet|             "btw  
    laag 9%     | ${euro(vat.low)}|   ${euro(lowBTW)}  
    hoog 21%    | ${euro(vat.high)}|  ${euro(highBTW)}
    geen 0%     | ${euro(vat.zero)}|  ${euro(0)}   
    ------------------------------------------------
    "           | "${euro(revenue)}|  "${euro(lowBTW + highBTW)}

    "restaurant | "omzet|             "btw  
    laag 9%     | €~~~~~~~~~|        €~~~~~~~~~|         
    hoog 21%    | €~~~~~~~~~|        €~~~~~~~~~|           
    geen 0%     | €~~~~~~~~~|        ${euro(0)}   
    ------------------------------------------------
    "           | "€~~~~~~~~~|       "€~~~~~~~~~|

    
                       ^^totaal afhaal ${euro(revenue)}|
                   ^^totaal restaurant €_~~~~~~~~~~~~~~|
                              ^^"totaal €~~~~~~~~~~~~~~| 



    |"betaalwijze | "afhaal|                "restaurant
    |cash         | ${euro(cashPayments)}|  €~~~~~~~~~|
    |pinnen       | ${euro(cardPayments)}|  €~~~~~~~~~|
`;

  for (const type in onlinePayments) {
    markup += `|${type.replace("_", " ")} | ${euro(
      onlinePayments[type]
    )}| ${euro(0)}
      `;
  }

  const svg = receiptline.transform(markup, {
    cpl: 46,
    encoding: "cp936",
    spacing: true,
  });

  // Converts the SVG to a PNG
  const svgBuffer = Buffer.from(svg);
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();
  return pngBuffer;
};

module.exports = createDailyReport;
