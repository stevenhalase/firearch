const crypto = require('crypto');

module.exports = class Model {
  constructor(modelName, modelSchema, firebase, models) {
    this._modelName = modelName;
    this._modelSchema = modelSchema;
    this._modelSchema._setFirebase(firebase);
    this._modelSchema._setModel(this);
    this._modelSchema._setModels(models);
    this._firebase = firebase;
  }

  _build(object) {
    return this._modelSchema._build(object);
  }

  _hooks(operation, object) {
    return this._modelSchema._hooks(operation, object);
  }

  _doPopulates(object) {
    return this._modelSchema._doPopulates(object);
  }

  findById(id) {
    return new Promise((resolve, reject) => {
      this._firebase.firestore().collection(this._modelName).doc(id).get()
      .then(doc => {
        return doc.data();
      })
      .then(doc => this._build(doc))
      .then(doc => this._hooks('findById', doc))
      .then(doc => this._doPopulates(doc))
      .then(doc => {
        resolve(doc);
      })
      .catch(error => {
        reject(error);
      });
    })
  }

  save(object, id) {
    return new Promise((resolve, reject) => {
      if (typeof id === 'undefined') {
        id = crypto.randomBytes(16).toString('hex');
      }

      const build = this._build(object);

      this._firebase.firestore().collection(this._modelName).doc(id).set(build)
        .then(() => {
          resolve(id);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  remove() {

  }

  
};