export function decodeVin(vin) {
  if (!vin || vin.length < 17) {
    return null;
  }

  return {
    vin: vin.toUpperCase(),
    region: vin[0],
    manufacturer: vin.slice(0, 3),
    modelYear: vin[9],
    plant: vin[10],
  };
}
