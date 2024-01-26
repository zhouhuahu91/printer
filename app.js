// Imports from for the printer to connect to Epson printer
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");

const createReceipt = require("./createReceipt");

// Initializes the printer.
let printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: "/dev/usb/lp0",
});

const print = async () => {
  const pngBuffer = createReceipt();
  // Print the PNG.
  await printer.printImageBuffer(pngBuffer);
  printer.cut();

  printer.execute();
};

print();
