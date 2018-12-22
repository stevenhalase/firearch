module.exports = class BooleanType {
  static validate(value) {
    return typeof value === 'boolean';
  }
  
  static validateArray(value) {
    return value.every(i => typeof i === 'boolean');
  }

  static getValue(value) {
    return Boolean(value);
  }

  static getValueArray(value) {
    const retVal = [];
    value.forEach(i => retVal.push(Boolean(i)));
    return retVal;
  }
};