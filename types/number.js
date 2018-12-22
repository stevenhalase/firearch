module.exports = class NumberType {
  static validate(value) {
    return typeof value === 'number';
  }
  
  static validateArray(value) {
    return value.every(i => typeof i === 'number');
  }

  static getValue(value) {
    return Number(value);
  }

  static getValueArray(value) {
    const retVal = [];
    value.forEach(i => retVal.push(Number(i)));
    return retVal;
  }
};