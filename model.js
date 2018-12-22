const crypto = require('crypto');

const { asyncForEach } = require('./utils');

module.exports = class Model {
  constructor(modelName, modelSchema, firebase, models) {
    this._modelName = modelName;
    this._modelSchema = modelSchema;
    this._modelSchema._setFirebase(firebase);
    this._modelSchema._setModel(this);
    this._modelSchema._setModels(models);
    this._firebase = firebase;
  }

  findById(id) {
    return new Promise((resolve, reject) => {
      this._firebase.firestore().collection(this._modelName).doc(id).get()
      .then(doc => {
        return doc.data();
      })
      .then(doc => this._modelSchema._build(doc))
      .then(doc => this._modelSchema._hooks('findById', doc))
      .then(doc => this._modelSchema._doPopulates(doc))
      .then(doc => this._modelSchema._doVirtuals(doc))
      .then(doc => {
        resolve(doc);
      })
      .catch(error => {
        reject(error);
      });
    })
  }

  find(field, operator, value) {
    return new Promise((resolve, reject) => {
      let query = this._firebase.firestore().collection(this._modelName);

      if (field && operator && value) {
        query = query.where(field, operator, value)
      }
      
      query.get()
      .then(querySnapshot => {
        const results = [];
        querySnapshot.forEach(doc => {
            results.push(doc.data());
        });
        return results;
      })
      .then(results => {
        const resultsBuild = [];
        results.forEach(doc => {
          resultsBuild.push(this._modelSchema._build(doc));
        });
        return resultsBuild;
      })
      .then(results => {
        const resultsHooks = [];
        results.forEach(doc => {
          resultsHooks.push(this._modelSchema._hooks('find', doc));
        });
        return resultsHooks;
      })
      .then(async results => {
        const resultsPopulates = [];
        await asyncForEach(results, async (doc) => {
          const res = await this._modelSchema._doPopulates(doc);
          resultsPopulates.push(res);
        });
        return resultsPopulates;
      })
      .then(async results => {
        const resultsVirtuals = [];
        await asyncForEach(results, async (doc) => {
          const res = await this._modelSchema._doVirtuals(doc);
          resultsVirtuals.push(res);
        });
        return resultsVirtuals;
      })
      .then(results => {
        resolve(results);
      })
      .catch(error => {
        reject(error);
      });
    })
  }

  save(object) {
    return new Promise((resolve, reject) => {
      const build = this._modelSchema._build(object);

      const docRef = this._firebase.firestore().collection(this._modelName).doc();
      const docId = docRef.id;
      build._id = docId;
      docRef.set(build)
        .then(doc => {
          resolve(docId);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  remove() {

  }

  
};