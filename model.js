const { asyncForEach } = require('./utils');

module.exports = class Model {
  constructor(modelName, modelSchema, firestoreInstance, storageInstance, storageBucketName, models) {
    this._modelName = modelName;
    this._modelSchema = modelSchema;
    this._modelSchema._setFirestoreInstance(firestoreInstance);
    this._modelSchema._setModel(this);
    this._modelSchema._setModels(models);
    this._firestoreInstance = firestoreInstance;
    this._storageInstance = storageInstance;
    this._storageBucketName = storageBucketName;
    this._createUploadMethods(); 
  }

  _createUploadMethods() { 
    if (!!this._modelSchema._uploads.length) { 
      for (const upload of this._modelSchema._uploads) { 
        this[`${upload.path}Upload`] = (fileName, file, id) => {
          return new Promise((resolve, reject) => { 
            this._upload(upload.storagePath, file, true, fileName, id, upload.path) 
              .then(response => { 
                resolve(response); 
              }) 
              .catch(error => { 
                reject(error); 
              }); 
          }); 
        } 
      } 
    } 
  }

  _fileUpload(fullStoragePath, file) { 
    return new Promise(async (resolve, reject) => { 
      const gcFile = this._storageInstance.bucket(this._storageBucketName).file(fullStoragePath);
      file.pipe(gcFile.createWriteStream({ predefinedAcl: 'publicread' }))
        .on('error', err => {
          reject(err);
        })
        .on('finish', () => {
          resolve(`https://${this._storageBucketName}.storage.googleapis.com/${fullStoragePath}`)
        });
    });
  }

  _upload(storagePath, file, updateObj, fileName, id, field) { 
    return new Promise((resolve, reject) => { 
      let fullStoragePath = updateObj ? storagePath.replace('{id}', id).replace('{fileName}', fileName) : storagePath;
      this._fileUpload(fullStoragePath, file) 
        .then(downloadUrl => { 
          if (updateObj) {
            const updateObj = {}; 
            updateObj[field] = downloadUrl; 
            this.updateById(id, updateObj) 
              .then(response => { 
                resolve(`${fileName} uploaded. Document ${id}'s ${field} successfully updated.`); 
              }); 
          } else {
            resolve(downloadUrl);
          }
        }) 
        .catch(error => {
          reject(error); 
        }) 
    }); 
  }

  findById(id, skipPopulate) {
    this._modelSchema._populates = [];
    return new Promise((resolve, reject) => {
      this._firestoreInstance.collection(this._modelName).doc(id).get()
      .then(doc => {
        return doc.data();
      })
      .then(doc => this._modelSchema._build(doc))
      .then(doc => {
        this._modelSchema._hooks('findById');
        return doc;
      })
      .then(doc => {
        if (!skipPopulate) {
          return this._modelSchema._doPopulates(doc)
        } else {
          return doc;
        }
      })
      .then(doc => this._modelSchema._doVirtuals(doc))
      .then(doc => {
        resolve(doc);
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  find(field, operator, value) {
    this._modelSchema._populates = [];
    return new Promise((resolve, reject) => {
      let query = this._firestoreInstance.collection(this._modelName);

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
        this._modelSchema._hooks('find');
        return results;
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
    });
  }

  save(object) {
    return new Promise((resolve, reject) => {
      try {
        const build = this._modelSchema._build(object);

        const docRef = this._firestoreInstance.collection(this._modelName).doc();
        const docId = docRef.id;
        build._id = docId;
        docRef.set(build)
          .then(doc => {
            resolve(docId);
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  removeById(id) {
    return new Promise((resolve, reject) => {
      if (typeof id === 'undefined') {
        reject('Missing id required parameter.');
        return;
      }

      try {
        this._firestoreInstance.collection(this._modelName).doc(id).delete()
          .then(() => {
            resolve(`Document ${id} successfully removed.`);
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  remove(field, operator, value) {
    return new Promise((resolve, reject) => {
      if (typeof field === 'undefined' || typeof operator === 'undefined' || typeof value === 'undefined') {
        reject('Missing field, operator or value required parameters.');
        return;
      }
      
      this._firestoreInstance.collection(this._modelName).where(field, operator, value).get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            doc.ref.delete();
          });
          resolve(`Removed ${querySnapshot.size} documents.`);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  updateById(id, updateObj) {
    return new Promise((resolve, reject) => {
      if (typeof id === 'undefined' || typeof updateObj === 'undefined') {
        reject('Missing id or updateObj required parameter.');
        return;
      }
      if (typeof updateObj !== 'object' || Object.keys(updateObj).length === 0) {
        reject('Expected updateObj to be a non-empty object.');
        return;
      }

      try {
        
        const build = this._modelSchema._build(updateObj, true);
        this._firestoreInstance.collection(this._modelName).doc(id).set(build, { merge: true })
          .then(() => {
            resolve(`Document ${id} successfully updated.`);
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  update(field, operator, value, updateObj) {
    return new Promise((resolve, reject) => {
      if (typeof field === 'undefined' || typeof operator === 'undefined' || typeof value === 'undefined' || typeof updateObj === 'undefined') {
        reject('Missing field, operator, value or updateObj required parameters.');
        return;
      }
      if (typeof updateObj !== 'object' || Object.keys(updateObj).length === 0) {
        reject('Expected updateObj to be a non-empty object.');
        return;
      }

      const build = this._modelSchema._build(updateObj, true);
      
      this._firestoreInstance.collection(this._modelName).where(field, operator, value).get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            doc.ref.set(build, { merge: true });
          });
          resolve(`Updated ${querySnapshot.size} documents.`);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  upload(storagePath, file) { 
    return new Promise((resolve, reject) => { 
      this._upload(storagePath, file, false)
        .then(downloadUrl => {
          resolve(downloadUrl);
        }) 
        .catch(error => { 
          reject(error); 
        }) 
    }); 
  }

};