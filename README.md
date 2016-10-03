# Easy Data for PhoneGap Apps with PouchDB

Web Unleashed 2016

Session content:
- Intro to PouchDB
- Getting set up
- Using for local storage
- Offline handling
- Data synchronization options 

## Introduction
>> PouchDB is an open-source JavaScript database inspired by Apache CouchDB that is designed to run well within the browser.

>> PouchDB was created to help web developers build applications that work as well offline as they do online.
It enables applications to store data locally while offline, then synchronize it with CouchDB and compatible servers when the 
application is back online, keeping the user's data in sync for the next time the login. 

## Getting Set Up

From the root of your PhoneGap/Cordova project...

1. Download a version >= 6.0.0 of `pouchdb.js` from [here](https://github.com/pouchdb/pouchdb/releases) and include it in your `index.html`.
** Be sure to include it **after** you `cordova.js` include to ensure you get the `deviceready` event.**

    <script src="/path/to/pouchdb.js"></script>

2. Install the [pouchdb-adapter-cordova-sqlite](https://github.com/nolanlawson/pouchdb-adapter-cordova-sqlite) adapter

    $ npm install pouchdb-adapter-cordova-sqlite

    >PouchDB adapter using either [Cordova-sqlite-storage](https://github.com/litehelpers/Cordova-sqlite-storage), 
    [cordova-plugin-sqlite-2](https://github.com/nolanlawson/cordova-plugin-sqlite-2) or [cordova-plugin-websql](https://www.npmjs.com/package/cordova-plugin-websql) 
    as its data store, depending on the device it's running from.

    >>As long as there is a global `cordova.sqlitePlugin` (or `openDatabase`) available, this adapter should work. The 
    name of the adapter for database init is *`cordova-sqlite`*.        

3. Reference the new adapter in the `index.html`

    <script src="lib/pouchdb/pouchdb.cordova-sqlite.min.js"></script>

2. Create a new database when the `deviceready` event is fired

        document.addEventListener('deviceready', function () {
            console.log("DEVICE READY!!!");
            PouchDB.plugin(PouchAdapterCordovaSqlite);
            var db = new PouchDB('database.db', {adapter: 'cordova-sqlite'});
            db.post({}).then(function (res) {
                return db.get(res.id);
            }).then(function (doc) {
                alert('stored a document! ' + JSON.stringify(doc));
                alert('adapter is: ' + db.adapter);
            }).catch(console.log.bind(console));
        });

    PouchDB.plugin(require('pouchdb-adapter-cordova-sqlite'));
    var db = new PouchDB('mydb.db', {adapter: 'cordova-sqlite'});


## PouchDB Server
pouchdb-server is a simple Node.js server that presents a simple REST API, which mimics that of CouchDB, on top of PouchDB

    $ npm install -g pouchdb-server

Requires: npm install riakdown

    $ pouchdb-server --level-backend riakdown --level-prefix riak://localhost:8087
    
    //Starts up a pouchdb-server that talks to Riak.
  



    hschinsk-osx:OfflineFirst hschinsk$ pouchdb-server -p 15984
    [info] pouchdb-server has started on http://127.0.0.1:15984/
    [info] navigate to http://127.0.0.1:15984/_utils for the Fauxton UI.
    [info] GET / 200 - 127.0.0.1


### Resources
- [PouchDB Inspector](https://chrome.google.com/webstore/detail/pouchdb-inspector/hbhhpaojmpfimakffndmpmpndcmonkfa)
- [PouchDB + PhoneGap](https://github.com/pouchdb/pouchdb/wiki/PouchDB-on-Phonegap)
- [PouchDB PhoneGap Cordova Notes](https://github.com/nolanlawson/pouchdb-phonegap-cordova)

