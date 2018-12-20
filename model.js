module.exports = class Model {
  constructor(modelName, modelSchema) {
    this._modelName = modelName;
    this._modelSchema = modelSchema;
  }

  find(where) {
    this._where = where;
  }

  save() {

  }

  remove() {

  }

  
};