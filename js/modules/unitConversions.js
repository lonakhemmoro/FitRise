/**
 * Convert height in feet'inches" to cm
 * @param {*} feet
 * @param {*} inch
 * @returns (int) imperial height to cm
 */
export function ftToCm(feet, inch) {
  const totalInches = 12 * feet + inch;
  return totalInches * 2.54;
}

/**
 * Convert cm to imperial height feet'inches"
 * @param {*} cm
 * @returns (obj) {feet (int), inches(int)}
 */
export function cmToFt(cm) {
  //Convert cm to inches
  const converted = cm / 2.54;

  //Get the feet part of the height
  const ft = Math.floor(converted / 12);
  //Get the inches part of the height
  let inch = converted - 12 * ft;
  //Round inches to the nearest int
  inch = Math.round(inch);

  return { feet: ft, inches: inch };
}

/**
 * Convert kg to pounds (lbs)
 * @param {*} kg
 * @returns (int)
 */
export function kgToLbs(kg) {
  return kg * 2.205;
}

/**
 * Convert pounds (lbs) to kg
 * @param {*} lbs
 * @returns (int)
 */
export function lbsToKg(lbs) {
  return lbs / 2.205;
}
