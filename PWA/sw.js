compareObjs = (obj1, obj2) => {
    for(let prop in obj1)
        if(!(prop in obj2)) return false
}

let staticVersion = '1';
let staticName = 'static-v' + staticVersion;
let dynamicName = 'dynamic-v' + staticVersion;

const staticAssets = [
    './',
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

self.addEventListener('install', async (evt) => {
    console.log('install');
    let staticCache = await caches.open(staticName);

    staticCache.addAll(staticAssets);
})

self.addEventListener('activate', async () => {
    let cachesKeys = await caches.keys();

    for(cacheKey of cachesKeys){
        if(!([staticName, dynamicName].includes(cacheKey))){
            await caches.delete(cacheKey);
        }
    }
})

