'use strict'
var dbPromise = idb.open('restaurants-store', 1, db => {
  if (!db.objectStoreNames.contains('restaurants')) {
    db.createObjectStore('restaurants');
  }
  if (!db.objectStoreNames.contains('reviews')) {
    db.createObjectStore('reviews');
  }

  if (!db.objectStoreNames.contains('sync-reviews')) {
    db.createObjectStore('sync-reviews');
  }

  if(!db.objectStoreNames.contains('sync-deleted-reviews')) {
    db.createObjectStore('sync-deleted-reviews');
  }
  if(!db.objectStoreNames.contains('sync-is-favorite')) {
    db.createObjectStore('sync-is-favorite');
  }
});

/**
 * Writes data to indexdb
 * @param {string} st
 * @param {{key: any}} data
 */
function writeData(st, data, dataKey) {
  return dbPromise.then((db) => {
    const tx = db.transaction(st, 'readwrite');
    tx.objectStore(st).put(data, dataKey);
    return tx.complete;
  });
}

function readDataByKey(st, key) {
  return dbPromise.then(db => {
    const tx = db.transaction(st, 'readonly');
    const store = tx.objectStore(st);
    return store.get(key);
  })
}

function readData(st) {
  return dbPromise.then((db) => {
    const tx = db.transaction(st, 'readonly');
    const store = tx.objectStore(st);
    return store.getAll().then(data => data);
  })
}

function clearAllData(st) {
  return dbPromise
    .then(function (db) {
      var tx = db.transaction(st, 'readwrite');
      var store = tx.objectStore(st);
      store.clear();
      return tx.complete;
    });
}

function readAllData(st) {
  return dbPromise.then(db => {
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    return store.getAll();
  })
}

function deleteItemFromData(st, id) {
  dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readwrite');
      var store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then(function() {
      console.log('Item deleted!');
    });
}

class ImageHelper {
  static creatSourcesForPicture(images, altValue) {
    return Object.keys(images).map(key => {
      if (key !== 'jpg') {
        const source = document.createElement('source');
        return ImageHelper.addAttributesToSource(source, images[key], key);
      } else {
        const img = document.createElement('img');
        img.setAttribute('data-src', images[key].url);
        img.alt = altValue;
        img.className = 'restaurant-img lazyload';
        return img;
      }
    });
  }

  static addAttributesToSource(source, picMetadata, key) {
    source.setAttribute('type', `image/${picMetadata.type}`);
    source.setAttribute(
      'media',
      `(min-width:${key.includes('280') ? '280px' : '500px'})`
    );
    source.setAttribute('srcset', picMetadata.url);
    source.className = 'restaurant-img lazyload';
    return source;
  }
}

function syncIsFavorite() {
  return readAllData('sync-is-favorite')
  .then(function (data) {
    console.log('sync data', data);
    for (var dt of data) {
      const id = Object.keys(dt)[0];
      const isFavorite = dt[id];
      DBHelper.manageFavorite(id, isFavorite)
        .then(function (res) {
          console.log('Sent data', res);
          if (res) {
            console.log('Favorite is updated', res);
            deleteItemFromData('sync-is-favorite', res.id.toString());
          }
        })
        .catch(function (err) {
          console.log('Error while sending data', err);
        });
    }
  })
}

function syncDeleteReviews() {
  return readAllData('sync-deleted-reviews')
    .then(function (data) {
      console.log('sync data', data);
      for (var dt of data) {
        DBHelper.deleteReview(dt.id)
          .then(function (res) {
            console.log('Sent data', res);
            if (res) {
              console.log('delete sync-deleted-reviews', res);
              deleteItemFromData('sync-deleted-reviews', res.id);
            }
          })
          .catch(function (err) {
            console.log('Error while sending data', err);
          });
      }
    })
}

function syncSubmittedPosts(){
  readAllData('sync-reviews')
    .then(function (data) {
      console.log('sync data', data);
      for (var dt of data) {
        const { id, ...item } = dt;
        console.log('item', item);
        DBHelper.addReview(item)
          .then(function (res) {
            console.log('Sent data', res);
            if (res.ok) {
              res.json()
                .then(resData => {
                  console.log('delete sync-post', resData);
                  deleteItemFromData('sync-reviews', id);
                });
            }
          })
          .catch(function (err) {
            console.log('Error while sending data', err);
          });
      }
    })
}
