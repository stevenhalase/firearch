const Firestore = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

const Schema = require('./schema');
const Model = require('./model');

class FireArch {
  constructor() {
    this._models = [];
    this._firestore = Firestore;
    this._storage = Storage;
    this._firestoreSettings = null;
    this._firestoreInstance = null;
    this._storageInstance = null;
    this._storageBucketName = null;
    this.Model = Model;
    this.Schema = Schema;
  }

  connect(firestoreSettings, storageBucketName) {
    this._firestoreSettings = firestoreSettings;
    this._storageBucketName = storageBucketName;
    this._createConnection();
  }

  model(modelName, modelSchema) {
    const newModel = new Model(modelName, modelSchema, this._firestoreInstance, this._storageInstance, this._storageBucketName, this._models);
    this._models.push(newModel);
    return newModel;
  }

  _createConnection() {
    this._firestoreInstance = new Firestore();
    this._firestoreInstance.settings(this._firestoreSettings);
    this._storageInstance = new Storage();
  }
}

const _fireArch = module.exports = new FireArch();