/* Keeps the scanner and the display page in step.

   Firebase mode: used when firebase-config.js has a config. Works across devices.
   Same-device mode: fallback. Works between tabs/windows of one browser.

   Stored shape (keys are prefixed so Firebase never turns them into arrays):
   rooms/<ROOM>/state      { scenario, revealed, cardCount, updated }
   rooms/<ROOM>/responses/s<scenario>/c<card> = 'trail' | 'caution' | 'risky'
*/
(function () {
  var FB_VERSION = '10.12.2';
  var cfg = window.TRAIL_FIREBASE_CONFIG;
  var useFirebase = !!(cfg && cfg.databaseURL && cfg.apiKey);

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res;
      s.onerror = function () { rej(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }

  function normalize(raw) {
    raw = raw || {};
    var st = raw.state || {};
    var out = {
      scenario: st.scenario | 0,
      revealed: !!st.revealed,
      cardCount: st.cardCount || 30,
      responses: {}
    };
    var r = raw.responses || {};
    Object.keys(r).forEach(function (sk) {
      var idx = parseInt(sk.slice(1), 10);
      out.responses[idx] = {};
      Object.keys(r[sk] || {}).forEach(function (ck) {
        out.responses[idx][parseInt(ck.slice(1), 10)] = r[sk][ck];
      });
    });
    return out;
  }

  function cleanRoom(code) {
    return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  }

  function makeRoomCode() {
    var a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }

  /* ---------- Firebase ---------- */
  function firebaseRoom(room) {
    var base = 'https://www.gstatic.com/firebasejs/' + FB_VERSION + '/';
    var ready = loadScript(base + 'firebase-app-compat.js')
      .then(function () { return loadScript(base + 'firebase-database-compat.js'); })
      .then(function () {
        if (!firebase.apps.length) firebase.initializeApp(cfg);
        return firebase.database();
      });
    var listeners = [], connListeners = [];

    ready.then(function (db) {
      db.ref('rooms/' + room).on('value', function (snap) {
        var v = normalize(snap.val());
        listeners.forEach(function (cb) { cb(v); });
      }, function (err) {
        connListeners.forEach(function (cb) { cb(false, err.message); });
      });
      db.ref('.info/connected').on('value', function (snap) {
        connListeners.forEach(function (cb) { cb(!!snap.val()); });
      });
    }).catch(function (err) {
      connListeners.forEach(function (cb) { cb(false, err.message); });
    });

    function ref(path) { return ready.then(function (db) { return db.ref('rooms/' + room + path); }); }

    return {
      mode: 'firebase', room: room,
      onState: function (cb) { listeners.push(cb); },
      onConnection: function (cb) { connListeners.push(cb); },
      setState: function (patch) {
        patch.updated = Date.now();
        return ref('/state').then(function (r) { return r.update(patch); });
      },
      record: function (scenario, map) {
        var upd = {};
        Object.keys(map).forEach(function (card) { upd['c' + card] = map[card]; });
        return ref('/responses/s' + scenario).then(function (r) { return r.update(upd); });
      },
      clear: function (scenario) {
        return ref('/responses/s' + scenario).then(function (r) { return r.remove(); });
      }
    };
  }

  /* ---------- Same device ---------- */
  function localRoom(room) {
    var key = 'trail-room:' + room;
    var chan = 'BroadcastChannel' in window ? new BroadcastChannel(key) : null;
    var listeners = [];

    function read() {
      try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
    }
    function emit() {
      var v = normalize(read());
      listeners.forEach(function (cb) { cb(v); });
    }
    function write(raw) {
      try { localStorage.setItem(key, JSON.stringify(raw)); } catch (e) {}
      if (chan) chan.postMessage('changed');
      emit();
      return Promise.resolve();
    }
    if (chan) chan.onmessage = emit;
    window.addEventListener('storage', function (e) { if (e.key === key) emit(); });

    return {
      mode: 'local', room: room,
      onState: function (cb) { listeners.push(cb); setTimeout(function () { cb(normalize(read())); }, 0); },
      onConnection: function (cb) { setTimeout(function () { cb(true); }, 0); },
      setState: function (patch) {
        var raw = read(); raw.state = raw.state || {};
        Object.keys(patch).forEach(function (k) { raw.state[k] = patch[k]; });
        return write(raw);
      },
      record: function (scenario, map) {
        var raw = read(); raw.responses = raw.responses || {};
        var s = raw.responses['s' + scenario] = raw.responses['s' + scenario] || {};
        Object.keys(map).forEach(function (card) { s['c' + card] = map[card]; });
        return write(raw);
      },
      clear: function (scenario) {
        var raw = read();
        if (raw.responses) delete raw.responses['s' + scenario];
        return write(raw);
      }
    };
  }

  window.TrailSync = {
    mode: useFirebase ? 'firebase' : 'local',
    cleanRoom: cleanRoom,
    makeRoomCode: makeRoomCode,
    connect: function (room) {
      room = cleanRoom(room);
      return useFirebase ? firebaseRoom(room) : localRoom(room);
    }
  };
})();
