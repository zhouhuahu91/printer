require("dotenv").config({ path: "./.env.local" });

const db = require("./firebase.js");
// Imports from for the printer to connect to Epson printer
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
// This functions turns the order into a png receipt
const sharp = require("sharp");
const createOrderReceipt = require("./createOrderReceipt.js");

(async () => {
  console.log("Printer is online.");

  const q = db.collection("printer");

  q.onSnapshot((snapshot) => {
    const data = snapshot.docs.map((doc) => {
      return { ...doc.data(), id: doc.id };
    });

    try {
      data.forEach(async (printJob) => {
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

          // ********* IF printjob is daily report we print the daily report ***************
        } else if (printJob.type === "dailyReport") {
          // sends the report in svg string directly
          const base64String = printJob.printContent;

          // First we need the receipt
          const svgBuffer = Buffer.from(base64String, "base64");
          const dailyReport = await sharp(svgBuffer).png().toBuffer();

          // Then print the receipt and wait for response
          printer.printImageBuffer(dailyReport);
          printer.cut();
          try {
            const status = await printer.execute();
            // If status is good we update printed to true
            if (status) {
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
              console.log("Daily report has been printed");
            } else {
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
            }
          } catch (e) {
            console.log(e.message);
          }
          // ********** IF CUSTOMER WANTS TO PRINT A RECEIPT *********
        } else if (printJob.type === "customerReceipt") {
          // sends the report in svg string directly
          const base64String = printJob.printContent;

          // First we need the receipt
          const svgBuffer = Buffer.from(base64String, "base64");
          const customerReceipt = await sharp(svgBuffer).png().toBuffer();

          // Then print the receipt and wait for response
          printer.printImageBuffer(customerReceipt);
          printer.cut();
          try {
            const status = await printer.execute();
            // If status is good we update printed to true
            if (status) {
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
              console.log("Customer receipt has been printed");
            } else {
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
            }
          } catch (e) {
            console.log(e.message);
          }

          // ********* IF WE WANT TO PRINT A RECEIPT FOR A TABLE ********
        } else if (printJob.type === "tableReceipt") {
          // sends the report in svg string directly
          const base64String = printJob.printContent;

          // First we need the receipt
          const svgBuffer = Buffer.from(base64String, "base64");
          const tableReceipt = await sharp(svgBuffer).png().toBuffer();

          // Then print the receipt and wait for response
          printer.printImageBuffer(tableReceipt);
          printer.cut();

          try {
            const status = await printer.execute();
            // If status is good we update printed to true
            if (status) {
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
              const ref = db.doc(`tables/${printJob.id}`);
              await ref.update({
                printed: true,
              });
            } else {
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
            }
          } catch (e) {
            console.log(e.message);
          }
          // ******** IF WE WANT TO PRINT FOOD TO THE KITCHEN *******
        } else if (printJob.type === "tableOrder") {
          // sends the report in svg string directly
          const base64String = printJob.printContent;

          // First we need the receipt
          const svgBuffer = Buffer.from(base64String, "base64");
          const tableOrder = await sharp(svgBuffer).png().toBuffer();

          // Then print the receipt and wait for response
          printer.printImageBuffer(tableOrder);
          printer.cut();

          try {
            const status = await printer.execute();
            // If status is good we update printed to true
            if (status) {
              // We remove order from the printer
              await db.collection("printer").doc(printJob.id).delete();
              // We need to set all the food items to printed true
              if (printJob.table) {
                const ref = db.doc(`tables/${printJob.id}`);
                await ref.update({
                  food: printJob.table.food.map((item) => ({
                    ...item,
                    printed: true,
                  })),
                });
              }
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
