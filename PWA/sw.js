function deepCompare () {
    let i, l, leftChain, rightChain;
  
    function compare2Objects (x, y) {
      let p;
  
      // remember that NaN === NaN returns false
      // and isNaN(undefined) returns true
      if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
           return true;
      }
  
      // Compare primitives and functions.     
      // Check if both arguments link to the same object.
      // Especially useful on the step where we compare prototypes
      if (x === y) {
          return true;
      }
  
      // Works in case when functions are created in constructor.
      // Comparing dates is a common scenario. Another built-ins?
      // We can even handle functions passed across iframes
      if ((typeof x === 'function' && typeof y === 'function') ||
         (x instanceof Date && y instanceof Date) ||
         (x instanceof RegExp && y instanceof RegExp) ||
         (x instanceof String && y instanceof String) ||
         (x instanceof Number && y instanceof Number)) {
          return x.toString() === y.toString();
      }
  
      // At last checking prototypes as good as we can
      if (!(x instanceof Object && y instanceof Object)) {
          return false;
      }
  
      if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
          return false;
      }
  
      if (x.constructor !== y.constructor) {
          return false;
      }
  
      if (x.prototype !== y.prototype) {
          return false;
      }
  
      // Check for infinitive linking loops
      if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
           return false;
      }
  
      // Quick checking of one object being a subset of another.
      // todo: cache the structure of arguments[0] for performance
      for (p in y) {
          if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
              return false;
          }
          else if (typeof y[p] !== typeof x[p]) {
              return false;
          }
      }
  
      for (p in x) {
          if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
              return false;
          }
          else if (typeof y[p] !== typeof x[p]) {
              return false;
          }
  
          switch (typeof (x[p])) {
              case 'object':
              case 'function':
  
                  leftChain.push(x);
                  rightChain.push(y);
  
                  if (!compare2Objects (x[p], y[p])) {
                      return false;
                  }
  
                  leftChain.pop();
                  rightChain.pop();
                  break;
  
              default:
                  if (x[p] !== y[p]) {
                      return false;
                  }
                  break;
          }
      }
  
      return true;
    }
  
    if (arguments.length < 1) {
      return true; //Die silently? Don't know how to handle such case, please help...
      // throw "Need two or more arguments to compare";
    }
  
    for (i = 1, l = arguments.length; i < l; i++) {
  
        leftChain = []; //Todo: this can be cached
        rightChain = [];
  
        if (!compare2Objects(arguments[0], arguments[i])) {
            return false;
        }
    }
  
    return true;
}

let staticVersion = '1.2';
let staticName = 'static-v' + staticVersion;
let dynamicName = 'dynamic-v' + staticVersion;

const staticAssets = [
    './index.html',
    './manifest.json',
    './icons/favicon-32x32.png',
    './icons/apple-icon-192x192.png',
    './icons/apple-icon-144x144.png',
    './style.css',
    './css/fonts.css',
    './css/animations.css',
    './css/variables.css',
    './fonts/Roboto-Regular.ttf',
    './fonts/Roboto-Medium.ttf',
    './images/arrow.svg',
    './images/lessons.svg',
    './images/notification.svg',
    './images/settings.svg',
    './app.js',
    './script.js',
    
];

self.addEventListener('install', async event => {
    const cache = await caches.open(staticName);
    await cache.addAll(staticAssets);
    console.log('Service worker has been installed');
});

self.addEventListener('activate', async event => {
    const cachesKeys = await caches.keys();
    const checkKeys = cachesKeys.map(async key => {
        if (![staticName, dynamicName].includes(key)) {
            await caches.delete(key);
        }
    });
    await Promise.all(checkKeys);
    console.log('Service worker has been activated');
});

self.addEventListener('fetch', event => {
    console.log(`Trying to fetch ${event.request.url}`);
    event.respondWith(checkCache(event.request));
});

async function checkCache(req) {
    const staticCache = await caches.open(staticName);
    const cachedResponse = staticCache ? await staticCache.match(req) : undefined;
    return cachedResponse || checkOnline(req);
}

async function checkOnline(req) {
    const cache = await caches.open(dynamicName);

    const cachedRes = await cache.match(req);
    try {
        const res = await fetch(req);
        if(deepCompare(res, cachedRes)){     
            return cachedRes;
        }
        await cache.put(req, res.clone());
        return res;
    } catch (error) {
        if (cachedRes) {
            return cachedRes;
        } else if (req.url.indexOf('.html') !== -1) {
            return caches.match('./offline.html');
        }
    }
}
// self.addEventListener('install', async (evt) => {
//     console.log('install');
//     let staticCache = await caches.open(staticName);

//     staticCache.addAll(staticAssets);
// })

// self.addEventListener('activate', async () => {
//     let cachesKeys = await caches.keys();

//     for(cacheKey of cachesKeys){
//         if(!([staticName, dynamicName].includes(cacheKey))){
//             await caches.delete(cacheKey);
//         }
//     }
// })

// self.addEventListener('fetch', async evt =>{
//     let staticCache = await caches.open(staticName);
    
//     let isInStatic = await staticCache.match(evt.request);
//     if(isInStatic){
//         return
//     }else{
//         // console.log('No in cache');
//         let dynamicCache = await caches.open(dynamicName);

//         let isInDynamic = await dynamicCache.match(evt.request);
//         if(isInDynamic){
//             let fetchRes = await fetch(evt.request.url);

//             if(!fetchRes.ok) throw Error('Не найдено или ошибка');

//             if(deepCompare(fetchRes, isInDynamic)){
//                 console.log('compare');
//             }else{
//                 console.log('nocompare');
//                 console.log(await dynamicCache.delete(evt.request));
//                 await dynamicCache.put(evt.request.url, fetchRes);
//                 await evt.respondWith(isInDynamic);
//             }
//         }else{
//             let fetchRes = await fetch(evt.request.url);

//             dynamicCache.put(evt.request.url, fetchRes);
//         }
//     }
// })
