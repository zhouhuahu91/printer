const express = require("express");
// Imports from for the printer to connect to Epson printer
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
// This functions turns the order into a png receipt
const createReceipt = require("./createReceipt");

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Initializes the printer.
let printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: "/dev/usb/lp0",
});

app.post("/print", async (req, res) => {
  try {
    const order = req.body; // The JSON object sent by the user is in req.body
    const receipt = await createReceipt(order);
    // Check if printer is connected
    // let isConnected = await printer.isPrinterConnected();
    let isConnected = true;
    // If connected we start printing.
    if (isConnected) {
      console.log("printing");

      // await printer.printImageBuffer(receipt);
      // printer.cut();
      // We execute the print.
      // const status = await printer.execute();
      const status = true;
      if (status) {
        // If print is succes we respond with order printed.
        res.send("order printed");
      } else {
        // If print failed we throw error
        throw new Error("Failed to execute print command");
      }
    } else {
      // If Printer is not connected we throw error
      throw new Error("Printer not connected");
    }
  } catch (e) {
    // Handle any errors that occur during processing
    res.status(500).send("Something went wrong: " + e.message);
  }
});

const port = 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
