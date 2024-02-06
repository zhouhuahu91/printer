const calculateVat = (order) => {
  // currently low is 9%
  let low = 0;
  // high is 21%
  let high = 0;
  // there are also items with zero vat
  let zero = 0;

  order.cart.forEach((item) => {
    if (item.btw === 9) {
      // add the price to low
      low += item.price;
    } else if (item.btw === 21) {
      // add the price to high
      high += item.price;
    } else if (item.btw === undefined) {
      // if items doesn't specify btw we assume it is low
      low += item.price;
    }
  });

  // delivery fee is low bracket
  if (order.delivery) {
    // add the delivery fee to low.
    low += order.storeFees.deliveryFee;
  }

  // plastic bag fee is high bracket
  if (order.bag && !order.delivery) {
    // add fee to high
    high += order.storeFees.plasticBagFee;
  }

  // transaction fee is in the high bracket
  if (order.paymentMethod === "online") {
    // add fee to zero
    high += order.storeFees.transactionFee;
  }

  // tip is in the zero bracket
  zero += order.tip;

  return { low, high, zero };
};

module.exports = calculateVat;
