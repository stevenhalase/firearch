module.exports = class DateType {
  static validate(value) {
    console.log(value);
    value = typeof value.seconds !== 'undefined' && typeof value.nanoseconds !== 'undefined'
      ? (value.seconds * 1000) + (value.nanoseconds / 1000000)
      : value;
    return (new Date(value)).getTime() > 0;
  }
  
  static validateArray(value) {
    return value.every(i => {
      i = typeof i.seconds !== 'undefined' && typeof i.nanoseconds !== 'undefined'
        ? (i.seconds * 1000) + (i.nanoseconds / 1000000)
        : i;
      (new Date(i)).getTime() > 0
    });
  }

  static getValue(value) {
    value = typeof value.seconds !== 'undefined' && typeof value.nanoseconds !== 'undefined'
    ? (value.seconds * 1000) + (value.nanoseconds / 1000000)
    : value;
    return value;
  }

  static getValueArray(value) {
    const retVal = [];
    value.forEach(i => {
      i = typeof i.seconds !== 'undefined' && typeof i.nanoseconds !== 'undefined'
        ? (i.seconds * 1000) + (i.nanoseconds / 1000000)
        : i;
      retVal.push(i)
    });
    return retVal;
  }
};