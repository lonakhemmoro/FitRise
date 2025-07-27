//Needed because "new Date(string)" is off by one day

function stringToDate(dateString) {
  return new Date(dateString + " 00:00:00");
}

export default stringToDate;
