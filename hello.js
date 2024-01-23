const {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BreakLine,
} = require("node-thermal-printer");

async function example() {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON, // 'star' or 'epson'
    interface: "/dev/usb/lp0",
    options: {
      timeout: 1000,
    },
    width: 48, // Number of characters in one line - default: 48
    characterSet: CharacterSet.SLOVENIA, // Character set - default: SLOVENIA
    breakLine: BreakLine.WORD, // Break line after WORD or CHARACTERS. Disabled with NONE - default: WORD
    removeSpecialCharacters: false, // Removes special characters - default: false
    lineCharacter: "-", // Use custom character for drawing lines - default: -
  });

  const isConnected = await printer.isPrinterConnected();
  console.log("Printer connected:", isConnected);

  printer.setTextSize(7, 7);
  printer.print("yooo");
  printer.println("test");
  printer.cut();
  try {
    await printer.execute();
    console.log("Print success.");
  } catch (error) {
    console.error("Print error:", error);
  }
}

example();
