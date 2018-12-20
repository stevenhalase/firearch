module.exports = class Schema {
  constructor(refName, fieldDefs) {
    this._refName = refName;
    this._fieldDefs = fieldDefs;
  }
};