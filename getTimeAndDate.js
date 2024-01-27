const currentDate = new Date();

const day = String(currentDate.getDate()).padStart(2, "0");
const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0!
const year = currentDate.getFullYear();

const hours = String(currentDate.getHours()).padStart(2, "0");
const minutes = String(currentDate.getMinutes()).padStart(2, "0");

const getTimeAndDate = () => {
  const formattedTime = `${hours}:${minutes}`;
  const formattedDate = `${day}/${month}/${year}`;

  return { formattedTime, formattedDate };
};

module.exports = getTimeAndDate;
