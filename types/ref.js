module.exports = class RefType {
  static validate(value) {
    return typeof value === 'string' && value.length === 20;
  }

  static validateArray(value) {
    return value.every(i => typeof i === 'string' && value.length === 20);
  }

  static getValue(value) {
    return String(value);
  }

  static getValueArray(value) {
    const retVal = [];
    value.forEach(i => retVal.push(String(i)));
    return retVal;
  }
};