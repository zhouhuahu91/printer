const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
const receiptline = require("receiptline");
const sharp = require("sharp");

// ReceiptLine
const text = `{
Ichigaya Terminal
1-Y-X Kudan, Chiyoda-ku
02-07-2021 21:00
{border:line; width:30}
^RECEIPT
{border:space; width:*,2,10}
^^^^周华                   | 2|     13.00
CHIDORI                | 2|    172.80
-------------------------------------
{width:*,20}
^TOTAL             |          ^185.80
CASH               |           200.00
CHANGE             |            14.20
{code:20210207210001; option:48,hri}`;

let printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: "/dev/usb/lp0",
});

const svg = receiptline.transform(text, {
  cpl: 46,
  encoding: "gb18030",
  spacing: true,
});

const print = async () => {
  const svgBuffer = Buffer.from(svg);
  console.log("test");
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();
  console.log("test");

  await printer.printImageBuffer(pngBuffer);
  printer.cut();

  printer.execute();
};

print();
