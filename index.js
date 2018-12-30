const Firestore = require('@google-cloud/firestore');

const Schema = require('./schema');
const Model = require('./model');

class FireArch {
  constructor() {
    this._models = [];
    this._firestore = Firestore;
    this._firestoreSettings = null;
    this._firestoreInstance = null;
    this.Model = Model;
    this.Schema = Schema;
  }

  connect(firestoreSettings) {
    this._firestoreSettings = firestoreSettings;
    this._createConnection();
  }

  model(modelName, modelSchema) {
    const newModel = new Model(modelName, modelSchema, this._firestoreInstance, this._models);
    this._models.push(newModel);
    return newModel;
  }

  _createConnection() {
    this._firestoreInstance = new Firestore();
    this._firestoreInstance.settings(this._firestoreSettings);
  }
}

const _fireArch = module.exports = new FireArch();