import Datastore from 'nedb';
const db = new Datastore({ filename: 'app/datafile.txt', autoload: true });

export const create = (docs) => {
    return new Promise((resolve, reject) => {
        db.insert(docs, function (err, newDocs) {
          if (err) {
            reject(err);
          } else {
            resolve(newDocs);
          }
        });
    });
}

export const find = (query) => {
    return new Promise((resolve, reject) => {
        db.find(query, function (err, docs) {
          if (err) {
            reject(err);
          } else {
            resolve(docs);
          }
        });
    });
}

export const findOne = (query) => {
    return new Promise((resolve, reject) => {
        db.findOne(query, function (err, doc) {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
    });
}

export const count = (query) => {
    return new Promise((resolve, reject) => {
        db.count(query, function (err, count) {
          if (err) {
            reject(err);
          } else {
            resolve(count);
          }
        });
    });
}

export const update = (query, values, options: any = {}) => {
    return new Promise((resolve, reject) => {
        db.update(query, values, options, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
    });
}

export const remove = (query, options: any = {}) => {
    return new Promise((resolve, reject) => {
        db.update(query, options, function (err, numRemoved) {
          if (err) {
            reject(err);
          } else {
            resolve(numRemoved);
          }
        });
    });
}