module.exports = class RefType {
  static validate(value) {
    return typeof value === 'string';
  }

  static getValue(value) {
    return String(value);
  }
};