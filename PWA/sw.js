let staticVersion = '1.3';
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
