const Schema = require('./schema');
const Model = require('./Model');

class FireArch {
  constructor() {
    this._models = [];
    this.Model = Model;
    this.Schema = Schema;
  }

  connect() {
    const _fireArch = this instanceof FireArch ? this : fireArch;
  }

  model(modelName, modelSchema) {
    const newModel = new Model(modelName, modelSchema);
    this._models.push(newModel);
    return newModel;
  }
}

const fireArch = module.exports = new FireArch();