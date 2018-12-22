module.exports = class Schema {
  constructor(fieldDefs) {
    this._fieldDefs = fieldDefs;
  }

  build(object) {
    console.log(object);
    console.log(this._fieldDefs);
    let retObject = {};
    for (const key in this._fieldDefs) {
      console.log(key);
      console.log(object.hasOwnProperty(key));
      if (object.hasOwnProperty(key)) {
        retObject[key] = object[key];
      }
    }

    return retObject;
  }
};