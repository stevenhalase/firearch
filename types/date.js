module.exports = class DateType {
  static validate(value) {
    return (new Date(value)).getTime() > 0;
  }
  
  static validateArray(value) {
    return value.every(i => (new Date(i)).getTime() > 0);
  }

  static getValue(value) {
    return value;
  }

  static getValueArray(value) {
    const retVal = [];
    value.forEach(i => retVal.push(i));
    return retVal;
  }
};