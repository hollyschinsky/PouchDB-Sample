# Easy Data for PhoneGap Apps with PouchDB

## Introduction
>PouchDB is an open-source JavaScript database inspired by Apache CouchDB that is designed to run well within the browser.

>PouchDB was created to help web developers build applications that work as well offline as they do online.
It enables applications to store data locally while offline, then synchronize it with CouchDB and compatible servers when the 
application is back online, keeping the user's data in sync for the next time the login. 

## Quick Start
1. Clone or download this repo 
2. Create a new PhoneGap or Cordova Project using the PhoneGap CLI or the PhoneGap Desktop App
        `$ phonegap create PouchDBApp` 

3. Copy in the `config.xml` file and `www` folder into the project created above
4. Serve the app from PhoneGap Desktop or the PhoneGap CLI from the root of your project

        `$ phonegap serve`
 

## Getting Set Up with PouchDB - General
1. Create a PhoneGap project using the PhoneGap Desktop app or the PhoneGap CLI

        `$ phonegap create MyPouchDBApp`
       
2. Open the new project from the root in your favorite editor

3. Download a version >= 6.0.0 of `pouchdb.js` from [here](https://github.com/pouchdb/pouchdb/releases) and include it in your `index.html`.
*Be sure to include it **after** `cordova.js` to ensure you get the `deviceready` event.*
=======
    <script src="/path/to/pouchdb.js"></script>

4. Download the [pouchdb-adapter-cordova-sqlite](https://github.com/nolanlawson/pouchdb-adapter-cordova-sqlite) adapter bundle
from [here](https://unpkg.com/pouchdb-adapter-cordova-sqlite/dist/pouchdb.cordova-sqlite.js) and include it in your project under
`www/lib/pouchdb`

    Alternatively - use npm to install it... 

    `$ npm install pouchdb-adapter-cordova-sqlite`


    >This is a PouchDB adapter using either [Cordova-sqlite-storage](https://github.com/litehelpers/Cordova-sqlite-storage), 
    [cordova-plugin-sqlite-2](https://github.com/nolanlawson/cordova-plugin-sqlite-2) or [cordova-plugin-websql](https://www.npmjs.com/package/cordova-plugin-websql) 
    as its data store, depending on the device it's running from.

    >As long as there is a global `cordova.sqlitePlugin` (or `openDatabase`) available, this adapter should work. The 
    name of the adapter for database init is *`cordova-sqlite`*.        

5. Reference the new adapter in the `index.html`

    `<script src="lib/pouchdb/pouchdb.cordova-sqlite.js"></script>`

6. Create a new local database when the `deviceready` event is fired

        document.addEventListener('deviceready', function () {
            // Setup PouchDB only on device ready
            PouchDB.plugin(PouchAdapterCordovaSqlite);
    
            // If mobile platform, we may want to use SQlite 
            if (ons.platform.isIOS() || ons.platform.isAndroid())
                myApp.db = new PouchDB('tasks.db', {adapter: 'cordova-sqlite'});
            else myApp.db = new PouchDB('tasks.db');                          
        };

7. Set up a remote database in the `deviceready` event handler
    ## PouchDB Server
    [pouchdb-server](https://github.com/pouchdb/pouchdb-server) is a simple Node.js server that presents a simple REST API, which mimics that of CouchDB, on top of PouchDB

        $ npm install -g pouchdb-server
        $ pouchdb-server -p 15984
        
        **Output**
        ```hschinsk-osx:OfflineFirst hschinsk$ pouchdb-server -p 15984
        [info] pouchdb-server has started on http://127.0.0.1:15984/
        [info] navigate to http://127.0.0.1:15984/_utils for the Fauxton UI.
        [info] GET / 200 - 127.0.0.1```


        // Create the remote database to sync to 
        myApp.remoteDB = new PouchDB("http://localhost:15984/tasks");

8. Start syncing        
            
            myApp.db.sync(myApp.remoteDB, {
				live: true,
				retry: true
			}).on('change', function (change) {
				console.log("A db change occurred " + JSON.stringify(change));				
			}).on('paused', function () {
				console.log("Replication paused");				
			}).on('active', function (info) {
				console.log("Replication resumed " + info);				
			}).on('error', function (err) {
				console.log("Sync Error occurred " + err);				
			})

9. Add API calls (see the www/js/services.js file for example calls)
10. Serve the app from PhoneGap Desktop or the PhoneGap CLI from the root of your project

        `$ phonegap serve`

11. Open your browser to the IP address returned from serve and start testing
12. Alternatively, add a mobile platform and test on your device or simulator
        

### Resources
- [PouchDB Inspector](https://chrome.google.com/webstore/detail/pouchdb-inspector/hbhhpaojmpfimakffndmpmpndcmonkfa)
- [PouchDB + PhoneGap](https://github.com/pouchdb/pouchdb/wiki/PouchDB-on-Phonegap)
- [PouchDB PhoneGap Cordova Notes](https://github.com/nolanlawson/pouchdb-phonegap-cordova)

