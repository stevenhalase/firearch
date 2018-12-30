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
    this._firestoreInstance = null;
    this._model = null;
    this._models = null;
    this._object = null;
    this._populates = [];
    this._virtuals = [];
    this._uploads = [];
  }

  _setFirestoreInstance(firestoreInstance) {
    this._firestoreInstance = firestoreInstance;
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
      if (!valid) {
        throw new Error(`${this._model._modelName} property '${key}' is invalid. Expected String. Value: ${value}.`);
      }
    }
    if (this._fieldDefs[key] === Boolean) {
      valid = BooleanType.validate(value);
      if (!valid) {
        throw new Error(`${this._model._modelName} property '${key}' is invalid. Expected Boolean. Value: ${value}.`);
      }
    }
    if (this._fieldDefs[key] === Date) {
      valid = DateType.validate(value);
      if (!valid) {
        throw new Error(`${this._model._modelName} property '${key}' is invalid. Expected Date. Value: ${value}.`);
      }
    }
    if (this._fieldDefs[key] === Number) {
      if (!valid) {
        throw new Error(`${this._model._modelName} property '${key}' is invalid. Expected Number. Value: ${value}.`);
      }
    }
    if (typeof this._fieldDefs[key] === 'object' && Object.keys(this._fieldDefs[key]).includes('ref')) {
      valid = RefType.validate(value);
      if (!valid) {
        throw new Error(`${this._model._modelName} property '${key}' is invalid. Expected Document ID. Value: ${value}.`);
      }
    }
    if (this._fieldDefs[key] instanceof Array) {
      if (this._fieldDefs[key][0] === String) {
        valid = StringType.validateArray(value);
        if (!valid) {
          throw new Error(`${this._model._modelName} property '${key}' is invalid. Expected Array<String>. Value: ${value}.`);
        }
      }
      if (typeof this._fieldDefs[key][0] === 'object' && Object.keys(this._fieldDefs[key][0]).includes('ref')) {
        valid = RefType.validateArray(value);
        if (!valid) {
          throw new Error(`${this._model._modelName} property '${key}' is invalid. Expected Array<Document ID>. Value: ${value}.`);
        }
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

  _hooks(operation) {
    for (const preOp of this._preOps) {
      if (preOp.operation === operation) {
        preOp.cb.call(this, this._next);
      }
    }
    return;
  }

  _next() {
    return;
  }

  _build(object, removeId) {
    let retObject = {};
    for (const key in this._fieldDefs) {
      // TODO: Build in required properties.
      if (object.hasOwnProperty(key) && typeof object[key] !== 'undefined') {
        try {
          this._validateField(key, object[key]);
          retObject[key] = this._getValue(key, object[key]);
        } catch (error) {
          console.warn(`Error processing ${this._model._modelName}. Operation Failed. Inner Exception: ${error.message}`);
          throw new Error(`Error processing ${this._model._modelName}. Operation Failed. Inner Exception: ${error.message}`);
        }
      }
    }

    retObject._id = object._id;
    if (removeId) {
      delete retObject._id;
    }

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
            if (typeof r !== 'undefined') {
              const res = await model.findById(r, true);
              results.push(res);
            }
          });
        }

        object[path] = results;
      } else {
        if (typeof object[path] !== 'undefined') {
          object[path] = await model.findById(object[path], true);
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

  upload(storagePath, path) {
    this._uploads.push({ storagePath, path }); 
  }
};