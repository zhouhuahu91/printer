require("dotenv").config({ path: "./.env.local" });

const db = require("./firebase.js");
// Imports from for the printer to connect to Epson printer
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
// This functions turns the order into a png receipt
const createReceipt = require("./createReceipt.js");

(async () => {
  const q = db
    .collection("orders")
    .where("printed", "==", false)
    .where("isPrinting", "==", true);

  q.onSnapshot((snapshot) => {
    const data = snapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    });

    // We loop over each order that hasn't been printed yet but is in the process of printing.
    data.forEach(async (order) => {
      // We get the snapshot if this order.
      const ref = db.doc(`orders/${order.id}`);
      const orderSnapshot = await ref.get();

      // We order doesn't exist we return from this order.
      if (orderSnapshot.exists === false) return; // Just in case order get deleted while in this process.

      // We initiate the printer.
      let printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: "/dev/usb/lp0",
      });
      // We check if the printer is connected
      let isConnected = await printer.isPrinterConnected();

      if (isConnected === false) {
        // If not connected we set order back to not printing
        await ref.update({
          isPrinting: false,
        });
        return console.log("Printer is not connected.");
      }

      // ***** HERE WE ACTUALLY PRINT THE ORDER ****
      // First we need the receipt
      const receipt = await createReceipt(order);

      // Then print the receipt and wait for response
      printer.printImageBuffer(receipt);
      printer.cut();
      const status = await printer.execute();

      // If status is good we update isPrinting to false and printed to true
      if (status) {
        await ref.update({
          isPrinting: false,
          printed: true,
        });

        // Something went wrong and we only set isPrinting back to false
      } else {
        await ref.update({
          isPrinting: false,
        });
      }
    });
  });
})();
