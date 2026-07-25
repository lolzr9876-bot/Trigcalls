self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>self.clients.claim());
self.addEventListener('fetch',e=>{});
self.addEventListener('push',e=>{const d=e.data?e.data.json():{title:'Trig',body:'Новое сообщение'};e.waitUntil(self.registration.showNotification(d.title||'Trig',{body:d.body||'',icon:'favicon.ico'}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(cs=>{for(const c of cs){if('focus'in c)return c.focus()}return clients.openWindow('/')}))});