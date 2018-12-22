module.exports = class StringType {
  static validate(value) {
    return typeof value === 'string';
  }

  static getValue(value) {
    return String(value);
  }
};