const StringType = require('./types/string');
const RefType = require('./types/ref');

module.exports = class Schema {
  constructor(fieldDefs) {
    this._fieldDefs = fieldDefs;
    this._preOps = [];
    this._firebase = null;
    this._model = null;
    this._models = null;
    this._object = null;
    this._populates = [];
    this._virtuals = [];
  }

  _setFirebase(firebase) {
    this._firebase = firebase;
  }

  _setModel(model) {
    this._model = model;
  }

  _setModels(models) {
    this._models = models;
  }

  _validateField(key, value) {
    let valid = false;

    if (this._fieldDefs[key] === String) {
      valid = StringType.validate(value);
    }
    if (typeof this._fieldDefs[key] === 'object' && Object.keys(this._fieldDefs[key]).includes('ref')) {
      valid = RefType.validate(value);
    }

    return valid;
  }

  _getValue(key, value) {
    let retVal = false;

    if (this._fieldDefs[key] === String) {
      retVal = StringType.getValue(value);
    }
    if (typeof this._fieldDefs[key] === 'object' && Object.keys(this._fieldDefs[key]).includes('ref')) {
      retVal = RefType.getValue(value);
    }

    return retVal;
  }

  _hooks(operation, object) {
    for (const preOp of this._preOps) {
      if (preOp.operation === operation) {
        preOp.cb.call(this, this._next);
      }
    }
    return object;
  }

  _next() {
    return;
  }

  _build(object) {
    let retObject = {};
    for (const key in this._fieldDefs) {
      if (object.hasOwnProperty(key)) {
        if (this._validateField(key, object[key])) {
          retObject[key] = this._getValue(key, object[key]);
        } else {
          console.warn(`Expected type ${this._fieldDefs[key]} for field ${key}`);
        }
      }
    }

    retObject._id = object._id;

    return retObject;
  }

  async _doPopulates(object) {
    for (const populate of this._populates) {
      const path = populate.path;
      const modelName = populate.model;
      const model = this._models.find(m => m._modelName === modelName);
      object[path] = await model.findById(object[path]);
    }
    return object;
  }

  async _doVirtuals(object) {
    for (const virtual of this._virtuals) {
      const fieldName = virtual.fieldName;
      const virtualDef = virtual.virtualDef;
      const model = this._models.find(m => m._modelName === virtualDef.ref);
      object[fieldName] = await model.find(virtualDef.foreignField, '==', object[virtualDef.localField]);
    }
    return object;
  }

  populate(def) {
    this._populates.push(def);
    return;
  }

  pre(operation, cb) {
    this._preOps.push({ operation, cb });
  }

  virtual(fieldName, virtualDef) {
    this._virtuals.push({ fieldName, virtualDef });
  }
};