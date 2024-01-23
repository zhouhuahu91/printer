const express = require("express");

const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");

const app = express();
const port = 8080;

const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON, // 'star' or 'epson'
  interface: "/dev/usb/lp0",
});

app.get("/", async (req, res) => {
  printer.print("Zhouhua");
  printer.cut();

  try {
    await printer.execute();
    res.status(200).json({ msg: "succes" });
  } catch (error) {
    console.error("Print error:", error);
  }
});

app.listen(port, () => {
  console.log("Listening on port:", port);
});
