/* eslint-env browser */
'use strict'
/**
 * Add service worker to restaraunt info page
 */
var online = navigator.onLine;
var localIdCounter = 0;

var ratingValue;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./sw.js')
    .then(() => {
      console.log('service worker registered!');
    })
    .catch(err => {
      console.log(err);
    });
}



class RestarauntInfo {
  constructor() {
    this.restaurant = null;
    this.isTitle = false;
  }

  /**
   * Get current restaurant from page URL.
   * @param {*} callback todo add desc
   */
  fetchRestaurantFromURL(callback) {
    if (this.restaurant) {
      // restaurant already fetched!
      return new Promise((resolve, reject) => {
        resolve(this.restaurant);
      });
    }
    const id = this.getParameterByName('id');
    if (!id) {
      // no id found in URL
      const error = 'No restaurant id in URL';

      return new Promise((resolve, reject) => {
        reject(error);
      });
    } else {
      return DBHelper.fetchRestaurantById(id).then(restaurant => {
        this.restaurant = restaurant;
        if (!restaurant) {
          console.error('restaurant not found');
          return;
        }

        this.fillRestaurantHTML();
        return restaurant;
      });
    }
  }

  /**
   * Create restaurant HTML and add it to the webpage
   * @param {*} restaurant todo add desc
   */
  fillRestaurantHTML(restaurant = this.restaurant) {
    const container = document.querySelector('#restaraunt-name');

    const restarauntName = document.createElement('h2');
    restarauntName.setAttribute('id', 'restaurant-name');
    restarauntName.innerHTML = restaurant.name;
    const picture = this.appendRestaurantImage(restaurant);

    container.insertAdjacentElement('afterbegin', picture);
    container.insertAdjacentElement('afterbegin', restarauntName);

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
      this.fillRestaurantHoursHTML();
    }

    const favoriteCheckbox = document.querySelector('#favoriteInput');
    favoriteCheckbox.checked = restaurant.is_favorite === 'true';
  }

  initReviews() {
    const id = this.getParameterByName('id');
    DBHelper.getRestaurantReviews(id)
    .then(res => {
      this.fillReviewsHTML(res);
    })
  }

  appendRestaurantImage(restaurant) {
    const picture = document.createElement('picture');
    picture.setAttribute('id', 'restaurant-img');
    const images = DBHelper.imageUrlForRestaurant(restaurant);
    const altValue = `Restaurant: ${restaurant.name}`;
    const sources = ImageHelper.creatSourcesForPicture(images, altValue);
    sources.forEach(source => picture.append(source));
    picture.className = 'lazyload';
    return picture;
  }

  /**
   * Create restaurant operating hours HTML table and add it to the webpage.
   * @param {*} operatingHours todo add desc
   */
  fillRestaurantHoursHTML(operatingHours = this.restaurant.operating_hours) {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
      if (key) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);
        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);
        hours.appendChild(row);
      }
    }
  }

  /**
   * Create all reviews HTML and add them to the webpage.
   * @param {*} reviews todo add desc
   */
  fillReviewsHTML(reviews = []) {
    const container = document.getElementById('reviews-container');
    this.appendTitle(container);
    reviews.length ? this.appendReviewsList(reviews) : this.appendNoReviews(container);
  }

  appendTitle(container) {
    if (this.isTitle) return;
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);
    this.isTitle = true;
  }

  appendNoReviews(container) {
    const noReviewsEl = document.querySelector('.no-review-message');
    if(noReviewsEl) return;
    const noReviews = document.createElement('p');
    noReviews.classList = ['no-review-message'];
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
  }

  appendReviewsList(reviews) {
    const container = document.getElementById('reviews-container');
    const reviewList = document.getElementById('reviews-list');
    this.clearPrevReviews(reviewList);
    reviews.forEach(review => {
      reviewList.appendChild(this.createReviewHTML(review));
    });
    container.appendChild(reviewList);
  }

  clearPrevReviews(reviewList) {
    while (reviewList.firstChild) {
      reviewList.firstChild.remove();
    }
  }

  /**
   * Create review HTML and add it to the webpage.
   * @param {*} review todo add desc
   * @return {*} li todo add desc
   */
  createReviewHTML(review) {
    const li = document.createElement('li');
    const id = review.id ? review.id : review.clientId;
    li.setAttribute('id', id);
    const reviewTitle = document.createElement('div');
    reviewTitle.className = 'review-title review-details';
    li.appendChild(reviewTitle);

    const name = document.createElement('p');
    name.innerHTML = review.name;
    name.className = 'reviewer-name';
    reviewTitle.appendChild(name);

    const deleteBtn = document.createElement('button');
    deleteBtn.classList = ['delete-btn'];
    deleteBtn.onclick = () => deleteReview(review);
    const deleteText = document.createElement('span');
    deleteText.innerText = 'Delete';
    deleteBtn.appendChild(deleteText);
    const xmlns = 'http://www.w3.org/2000/svg';
    const deleteSVG = document.createElementNS(xmlns, 'svg');
    deleteSVG.setAttributeNS(null, 'width', 20);
    deleteSVG.setAttributeNS(null, 'height', 20);
    deleteSVG.setAttributeNS(null, 'viewBox', '0 0 24 24');
    deleteSVG.setAttributeNS(null, 'fill', 'white');
    const deleteSVGPath = document.createElementNS(xmlns, 'path');
    deleteSVGPath.setAttributeNS(null, 'd', 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z');
    const deleteSVGPath1 = document.createElementNS(xmlns, 'path');
    deleteSVGPath1.setAttributeNS(null, 'd', 'M0 0h24v24H0z');
    deleteSVGPath1.setAttributeNS(null, 'fill', 'none');
    const deleteSVGDesc = document.createElementNS(xmlns, 'desc');
    deleteSVGDesc.innerHTML = 'Delete review';
    deleteSVG.appendChild(deleteSVGDesc);
    deleteSVG.appendChild(deleteSVGPath);
    deleteSVG.appendChild(deleteSVGPath1);


    deleteBtn.appendChild(deleteSVG);
    reviewTitle.appendChild(deleteBtn);

    const reviewContent = document.createElement('div');
    reviewContent.className = 'review-content review-details';
    li.appendChild(reviewContent);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    rating.className = 'review-rating uppercase';
    reviewContent.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    reviewContent.appendChild(comments);

    return li;
  }

  /**
   * Add restaurant name to the breadcrumb navigation menu
   * @param {*} restaurant todo add desc
   */
  fillBreadcrumb(restaurant = this.restaurant) {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    li.setAttribute('aria-current', 'page');
    breadcrumb.appendChild(li);
  }

  /**
   * Get a parameter by name from page URL.
   * @param {*} name todo add desc
   * @param {*} url todo add desc
   * @return {*} todo add return
   */
  getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
}

const restarauntInfo = new RestarauntInfo();
restarauntInfo.initReviews();
/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  restarauntInfo.fetchRestaurantFromURL()
    .then(restaurant => {
      const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      restarauntInfo.fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(restarauntInfo.restaurant, map);
    });
};

const accBtn = document.querySelector('.accordion');
if (online) {
  accBtn.addEventListener('click', () => {
    const map = document.querySelector('#map');
    map.classList.toggle('show');
    accBtn.classList.toggle('active');
    accBtn.innerText = getAccordionText(accBtn.innerText);
  });
} else {
  accBtn.style.display = 'none';
}



function setRating(index) {
  const radioButtons = document.querySelectorAll('.form-group .rating-label');
  radioButtons.forEach((button, i) => {
    button.innerText = (i + 1) > index ? '☆' : '★';
  });
  ratingValue = index;
  onFormValueChange();
}

function getAccordionText(text) {
  return text === 'SHOW MAP' ? 'HIDE MAP' : 'SHOW MAP';
}

function toggleFormView() {
  const form = document.querySelector('.add-review form');
  form.style.display = form.style.display ?
    form.style.display === 'none' ? 'block' : 'none' :
    'block'
  setRating(0);
}

function submitForm() {
  const formValues = getFormData();
  const id = restarauntInfo.getParameterByName('id');
  const data = Object.assign({}, {
    restaurant_id: id
  }, formValues);
  postReview(data);
}

function postReview(formData) {
  const id = restarauntInfo.getParameterByName('id');
  const postId = new Date().toISOString();
  const data = Object.assign({}, {
    restaurant_id: id,
    clientId: getClientId(),
  }, formData);
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    addReviewToSyncSW();
  } else {
    DBHelper.addReview(data).then((res) => {
      console.log('res', res);
      updateUI(res);
      resetForm();
    });
  }


  function addReviewToSyncSW() {
    readDataByKey('reviews', id).then(res => {
      const reviews = [...res, data];
      writeData('reviews', reviews, id).then(() => {
        console.log('update local reviews', reviews);
        restarauntInfo.fillReviewsHTML(reviews);
        navigator.serviceWorker.ready
          .then((sw) => {
            writeData('sync-reviews', Object.assign({}, data, { id: postId }), postId).then(() => {
              console.log('review posted');
              resetForm();
              return sw.sync.register('post-new-review');
            }).then(() => {
              const toast = document.querySelector('#toast');
              toaster.classList = ['show'];
              toast.innerText = 'Your review was saved';
            })
              .catch(function (err) {
                console.log(err);
              });
          });
      });
    });
  }
}

function deleteReview(review) {
  const id = restarauntInfo.getParameterByName('id');
  if (!review.id && review.clientId) {
    readDataByKey('reviews', id).then(res => {
      const reviews = res.filter(item => item.clientId !== review.clientId);
      writeData('reviews', reviews, id).then(() => {
        deleteItemFromData('sync-reviews', review.clientId);
        deleteReviewFromDom(review);
      });
    })
  } else {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      readDataByKey('reviews', id).then(res => {
        const reviews = res.filter(item => item.id !== review.id);
        writeData('reviews', reviews, id).then(() => {
          console.log('update local reviews after delete', reviews);
          restarauntInfo.fillReviewsHTML(reviews);
          navigator.serviceWorker.ready.then(sw => {
            writeData('sync-deleted-reviews', review, review.id).then(() => {
              deleteReviewFromDom(review);
              return sw.sync.register('delete-review');
            })
          })
        })
      })
    } else {
      DBHelper.deleteReview(review.id)
        .then(res => {
          deleteReviewFromDom(res);
        });
    }
  }
}

function resetForm() {
  const form = document.querySelector('.add-review form');
  form.reset();
  setRating(0);
}

function updateUI(res) {
  const ul = document.getElementById('reviews-list');
  ul.appendChild(restarauntInfo.createReviewHTML(res));
}

function onFormValueChange() {
  const button = document.querySelector('.submit button');
  button.disabled = !isFormValid();
}

function isFormValid() {
  const formValues = getFormData();
  return !!(formValues.name.trim() && formValues.comments.trim() && formValues.rating);
}

function resetForm() {
  toggleFormView();
}



const getFormData = () => {
  return {
    name: getNameValue(),
    rating: ratingValue,
    comments: getCommentsValue()
  }
}

const getNameValue = () => document.querySelector('#name-input').value;
const getCommentsValue = () => document.querySelector('#review-input').value;

const deleteReviewFromDom = (res) => {
  const reviewList = document.querySelectorAll('#reviews-list li');
  reviewList.forEach(review => {
    if (review.id == res.id || review.id === res.clientId) {
      review.remove();
    }
  })
}

function getClientId() {
  const result = `clientId${localIdCounter}`;
  localIdCounter++;
  return result;
}

window.addEventListener('online', onOnline);
window.addEventListener('offline', onOffline);

function onOnline() {
  const toaster = document.querySelector('#toast');
  toaster.classList = ['show'];
  syncData();

  toaster.innerText = 'You are online';
  setTimeout(() => {
    toaster.classList = [];
  }, 2000)
}

function onOffline() {
  const toaster = document.querySelector('#toast');
  toaster.classList = ['show'];
  toaster.innerText = 'You are offline';
  setTimeout(() => {
    toaster.classList = [];
  }, 2000)
}

function syncData() {
  syncSubmittedPosts().then(() => {
    syncDeleteReviews().then(() => {
      syncIsFavorite().then(() => {
        updateView();
      })
    })
  })
}


function updateView() {
  console.log('online');
  const toast = document.querySelector('#toast');
  toast.innerText = 'Online';
  restarauntInfo.fetchRestaurantFromURL()
    .then(restaurant => {
      if (navigator.onLine) {
        const map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });
        DBHelper.mapMarkerForRestaurant(restarauntInfo.restaurant, map);
      }
      restarauntInfo.fillBreadcrumb();
    });
}

function onFavoriteClickHandler(event) {
  const id = restarauntInfo.getParameterByName('id');
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    readData('restaurants').then(res => {
      const updatedRestaurants = res.map(item =>  {
        if (item.id === id) {
          item.is_favorite = event.target.checked;
        }
        return item;
      });
      clearAllData('restaurants').then(() => {
        writeData('restaurants', updatedRestaurants, 'restaurants').then(() => {
          navigator.serviceWorker.ready.then(sw => {
            let data = {};
            data[id] = event.target.checked;
            writeData('sync-is-favorite', data, id).then(() => {
              return sw.sync.register('is-favorite');
            })
          })
        })
      });
    })
  } else {
    DBHelper.manageFavorite(id, event.target.checked)
    .then((res) =>  console.log('favorites', res))
  }
}

function onRatingKeyup(event, rating) {
  if(event.code === 'Space' || event.code === 32) {
    event.preventDefault();
    setRating(rating);
  }
}

window.addEventListener('keydown', function(event){
  if (event.keyCode === 13 || event.keyCode === 'Enter') {
    event.preventDefault();
    return false;
  }
});

