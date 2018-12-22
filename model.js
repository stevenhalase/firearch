const crypto = require('crypto');

module.exports = class Model {
  constructor(modelName, modelSchema, firebase) {
    this._modelName = modelName;
    this._modelSchema = modelSchema;
    this._firebase = firebase;
  }

  _build(object) {
    return this._modelSchema.build(object);
  }

  findById(id) {
    return new Promise((resolve, reject) => {
      this._firebase.firestore().collection(this._modelName).doc(id).get()
        .then(function(doc) {
            resolve(doc.data());
        })
        .catch(function(error) {
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
        .then(function(doc) {
            resolve(doc);
        })
        .catch(function(error) {
            reject(error);
        });
    });
  }

  remove() {

  }

  
};