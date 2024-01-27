// This functions receives a price(number) and return the euro format.
// 2500 => € 25,00
const euro = (value) => {
  const formatter = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  });
  let amount = value;
  // We check if value is a string or not if it is we convert it to a number.
  if (typeof value === "string") {
    amount = parseFloat(amount);
  }
  // We return the formated amount devided by 100 because we receive the prices in cents.
  // 100 = 1 euro
  return formatter.format(amount / 100);
};

module.exports = euro;
