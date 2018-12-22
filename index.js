const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');
require('firebase/firestore');

const Schema = require('./schema');
const Model = require('./model');

class FireArch {
  constructor() {
    this._models = [];
    this._firebase = firebase;
    this.Model = Model;
    this.Schema = Schema;
  }

  connect(firebaseConfig, firestoreSettings) {
    this._firebaseConfig = firebaseConfig;
    this._firestoreSettings = firestoreSettings;
    this._createConnection();
  }

  model(modelName, modelSchema) {
    const newModel = new Model(modelName, modelSchema, this._firebase, this._models);
    this._models.push(newModel);
    return newModel;
  }

  _createConnection() {
    this._firebase.initializeApp(this._firebaseConfig);
    this._firebase.firestore().settings(this._firestoreSettings);
  }
}

const _fireArch = module.exports = new FireArch();