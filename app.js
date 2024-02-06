require("dotenv").config({ path: "./.env.local" });

const db = require("./firebase.js");
// Imports from for the printer to connect to Epson printer
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
// This functions turns the order into a png receipt
const createOrderReceipt = require("./createOrderReceipt.js");
const createDailyReport = require("./createDailyReport.js")(async () => {
  console.log("Printer is online.");

  const q = db.collection("printer");

  q.onSnapshot((snapshot) => {
    const data = snapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    });

    try {
      data.forEach(async (printJob) => {
        // We need to know what kind of printjob it is.

        // If type is an order than we create an order receipt and print it.
        if (printJob.type === "order") {
          // The order we want to print
          const order = printJob.printContent;

          // Get ref to make future changes to this order
          const ref = db.doc(`orders/${order.id}`);
          const orderSnapshot = await ref.get();

          // If order doesn't exist we exit this function and remove order from printer.
          if (orderSnapshot.exists === false) {
            await db.collection("printer").doc(printJob.id).delete();
            return console.log("order does not exist");
          } // Just in case order get deleted while in this process.

          // We init the printer
          let printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: "/dev/usb/lp0",
          });
          // We check if the printer is connected
          let isConnected = await printer.isPrinterConnected();

          if (isConnected === false) {
            // We remove order from the printer
            await db.collection("printer").doc(printJob.id).delete();
            // And exit the function
            return console.log("Printer is not connected.");
          }

          // ***** HERE WE ACTUALLY PRINT THE ORDER ****

          // First we need the receipt
          const orderReceipt = await createOrderReceipt(order);

          // Then print the receipt and wait for response
          printer.printImageBuffer(orderReceipt);
          printer.cut();
          try {
            const status = await printer.execute();
            // If status is good we update printed to true
            if (status) {
              await ref.update({
                printed: true,
              });
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
            } else {
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
            }
          } catch (e) {
            console.log(e.message);
          }
        } else if (printJob === "dailyReport") {
          const svg = printJob.printConent;
          // We init the printer
          let printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: "/dev/usb/lp0",
          });
          // We check if the printer is connected
          let isConnected = await printer.isPrinterConnected();

          if (isConnected === false) {
            // We remove order from the printer
            await db.collection("printer").doc(printJob.id).delete();
            // And exit the function
            return console.log("Printer is not connected.");
          }

          // ***** HERE WE ACTUALLY PRINT THE ORDER ****

          // First we need the receipt
          const svgBuffer = Buffer.from(svg);
          const dailyReport = await sharp(svgBuffer).png().toBuffer();

          // Then print the receipt and wait for response
          printer.printImageBuffer(dailyReport);
          printer.cut();
          try {
            const status = await printer.execute();
            // If status is good we update printed to true
            if (status) {
              await ref.update({
                printed: true,
              });
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
            } else {
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
            }
          } catch (e) {
            console.log(e.message);
          }
        } else {
          // Else this printjob does not exist and we remove it from server.
          console.log(`${printJob.type} printjob doesn't exist`);
          await db.collection("printer").doc(printJob.id).delete();
        }
      });
    } catch (e) {
      console.log(e.message);
    }
  });
})();
