module.exports = class Schema {
  constructor(fieldDefs) {
    this._fieldDefs = fieldDefs;
  }

  build(object) {
    let retObject = {};
    for (const key in this._fieldDefs) {
      if (object.hasOwnProperty(key)) {
        retObject[key] = object[key];
      }
    }

    return retObject;
  }
};