const express = require("express");
const cors = require("cors");
// Imports from for the printer to connect to Epson printer
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
// This functions turns the order into a png receipt
const createReceipt = require("./createReceipt");

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Middleware to allow cors

// Define your secret API key
const SECRET_API_KEY = process.env.PRINTER_API; // Replace with your actual API key

// Middleware to check the API key in query parameters
const checkAPIKey = (req, res, next) => {
  const apiKey = req.qeury.key;
  if (apiKey && apiKey === SECRET_API_KEY) {
    next(); // Correct API key, proceed to the route handler
  } else {
    res.status(401).send("Invalid or missing API key"); // Incorrect or missing API key
  }
};

app.post("/print", checkAPIKey, async (req, res) => {
  try {
    const order = req.body; // The JSON object sent by the user is in req.body
    // Initializes the printer. // Need to be in the function otherwise it caches the old reqeusts
    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: "/dev/usb/lp0",
    });
    const receipt = await createReceipt(order);
    // Check if printer is connected
    let isConnected = await printer.isPrinterConnected();
    // If connected we start printing.
    if (isConnected) {
      printer.printImageBuffer(receipt);
      printer.cut();
      // We execute the print.
      const status = await printer.execute();
      // const status = true;
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
