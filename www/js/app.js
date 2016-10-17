// App logic.
window.myApp = {};

// Init Event Handler
document.addEventListener('init', function(event) {
    var page = event.target;    
   
    // Each page calls its own initialization controller.
    if (myApp.controllers.hasOwnProperty(page.id)) {
        console.log("Initialize ");
        myApp.controllers[page.id](page);        
    }
       
});

// Page Show Event Handler
document.addEventListener('show', function(event) {
    var page = event.target;    
   
    // Hack for duplicate tab page issue in Onsen UI on Safari Mobile
    // https://github.com/OnsenUI/OnsenUI/issues/1584
    if (ons.platform.isIOS()) {
        var tabs = document.querySelector('#myTabbar').getElementsByTagName('ons-page');
        for (var i=0; i<tabs.length; i++) {
            var tabbar = document.querySelector('.tab-bar__content');
            if (tabs[i].id=="completedTasksPage") {
                if (i>0) {
                    tabbar.removeChild(tabs[i]);                
                }
                else document.querySelector('#completedTasksPage').setAttribute('style',"display:block")
            }
        }
    }
});

// Device Ready Event Handler
// Setup PouchDB only on device ready    
document.addEventListener('deviceready', function () {
    console.log("Device ready event fired ");
    myApp.isOnline = navigator.onLine; // browser support for checking connection - may not be present everywhere
    myApp.initConnectionAndDB();
});


// 1) Check for the connection to detect offline situations and add event handlers for when it goes
// on/offline based on platform
// 2) Create the database depending on platform. If mobile we may want to use SQLite adapter. This could
// fail when running in mobile device emulation mode since SQLite plugin thinks it's on a device due to
// user agent (ons platform value too)
myApp.initConnectionAndDB = function() { 
 
    if (ons.platform.isIOS() || ons.platform.isAndroid()) {
        // Running on mobile device or in mobile simulator mode...
        
        // Use network information plugin to detect current connection status
        if (navigator.connection && navigator.connection.type == Connection.NONE) {
            console.log("Plugin found but connection shows that you're not online")
            myApp.isOnline = false;
        }  
        else myApp.isOnline = true;   

        // Network information plugin events to detect offline when running on mobile
        document.addEventListener('online', function() {
            console.log("MOBILE Online detected")
            myApp.isOnline = true;
        })
        document.addEventListener('offline', function() {
            console.log("MOBILE Offline detected")
            myApp.isOnline = false;
        })
        PouchDB.plugin(PouchAdapterCordovaSqlite);
        
        // Create local database with SQLite adapter
        myApp.db = new PouchDB('tasks.db', {adapter: 'cordova-sqlite'});
                        
    }
    // Running in the browser (non-mobile emulation etc)
    else {
        window.addEventListener('online', function() {
            console.log("Online detected")
            myApp.isOnline = true;
        })
        window.addEventListener('offline', function() {
            console.log("Offline detected")
            myApp.isOnline = false;
        })
        // Create local database based on default in browser
        myApp.db = new PouchDB('tasks.db');
    }  
    
    // Create or open the remote database to sync to - requires you to start up the PouchDB server 1st (see readme) 
    myApp.remoteDB = new PouchDB("http://localhost:15984/tasks");
    
    // Make a call to get the info on the db. We should add error handling in case it didn't get created properly since this
    // is the 1st time it will try to use it. If you omit this error handling and are running in mobile emulation mode in your 
    // desktop browser it will fail since the user agent is returning mobile. 
    myApp.db.info().then(function (info) {
        console.log("Local DB info " + JSON.stringify(info));          
    }).catch(function (err) {
        console.log("Error using local database - this may happen if you specified an adapter like SQLite only available on native mobile device but are actually running in the browser in chrome mobile simulator mode (user agent returns mobile)." + err);        
    })
    
    myApp.remoteDB.info().then(function (info) {
        console.log("Remote DB info " + JSON.stringify(info));          
    })

    // Fetch the existing rows from the remote db if any exist and add them to the appropriate list
    if (myApp.isOnline) {
        console.log("You're online, init with remote database");
        myApp.services.pouch.initWithRemote();
    }
    else {
        console.log("You're offline, init with local database");
        myApp.services.pouch.initWithLocal();
    }
    
    // Turn on live 2-way syncing
    myApp.services.pouch.sync();

}
