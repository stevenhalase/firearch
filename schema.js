const StringType = require('./types/string');
const BooleanType = require('./types/boolean');
const DateType = require('./types/date');
const NumberType = require('./types/number');
const RefType = require('./types/ref');

const { asyncForEach } = require('./utils');

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
    if (this._fieldDefs[key] === Boolean) {
      valid = BooleanType.validate(value);
    }
    if (this._fieldDefs[key] === Date) {
      valid = DateType.validate(value);
    }
    if (this._fieldDefs[key] === Number) {
      valid = NumberType.validate(value);
    }
    if (typeof this._fieldDefs[key] === 'object' && Object.keys(this._fieldDefs[key]).includes('ref')) {
      valid = RefType.validate(value);
    }
    if (this._fieldDefs[key] instanceof Array) {
      if (this._fieldDefs[key][0] === String) {
        valid = StringType.validateArray(value);
      }
      if (typeof this._fieldDefs[key][0] === 'object' && Object.keys(this._fieldDefs[key][0]).includes('ref')) {
        valid = RefType.validateArray(value);
      }
    }

    return valid;
  }

  _getValue(key, value) {
    let retVal = null;

    if (this._fieldDefs[key] === String) {
      retVal = StringType.getValue(value);
    }
    if (this._fieldDefs[key] === Boolean) {
      retVal = BooleanType.getValue(value);
    }
    if (this._fieldDefs[key] === Date) {
      retVal = DateType.getValue(value);
    }
    if (this._fieldDefs[key] === Number) {
      retVal = NumberType.getValue(value);
    }
    if (typeof this._fieldDefs[key] === 'object' && Object.keys(this._fieldDefs[key]).includes('ref')) {
      retVal = RefType.getValue(value);
    }
    if (this._fieldDefs[key] instanceof Array) {
      if (this._fieldDefs[key][0] === String) {
        retVal = StringType.getValueArray(value);
      }
      if (typeof this._fieldDefs[key][0] === 'object' && Object.keys(this._fieldDefs[key][0]).includes('ref')) {
        retVal = RefType.getValueArray(value);
      }
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
      if (object.hasOwnProperty(key) && typeof object[key] !== 'undefined') {
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

      if (this._model._modelSchema._fieldDefs[path] instanceof Array) {
        const results = [];

        if (object[path] && object[path].length > 0) {
          await asyncForEach(object[path], async (r) => {
            const res = await model.findById(r);
            results.push(res);
          });
        }

        object[path] = results;
      } else {
        if (typeof object[path] !== 'undefined') {
          object[path] = await model.findById(object[path]);
        }
      }
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