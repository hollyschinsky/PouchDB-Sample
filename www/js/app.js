// App logic.
window.myApp = {};

// Init Event Handler
document.addEventListener('init', function(event) {
    var page = event.target;    
   
    // Each page calls its own initialization controller.
    if (myApp.controllers.hasOwnProperty(page.id)) {
        myApp.controllers[page.id](page);        
    }      
});

// Device Ready Event Handler
//   1 - Check for the connection to detect offline situations and add event handlers for when it goes
//       on/offline based on platform
//   2 - Create the database depending on platform. If mobile we may want to use SQLite adapter. This could
//       fail when running in mobile device emulation mode since SQLite plugin thinks it's on a device due to
//       user agent (onsen platform value too)    
document.addEventListener('deviceready', function () {
    console.log("Device ready event fired ");
    myApp.isOnline = navigator.onLine; // browser flag for checking connection (may not always work)
    var dbName = 'my_todos.db';        // use a different local name for each to test multiple concurrent browsers

    // Check if running on mobile device or in mobile simulator mode...
    if (ons.platform.isIOS() || ons.platform.isAndroid()) {        
        // Use network information plugin to detect current connection status
        if (navigator.connection && navigator.connection.type == Connection.NONE) 
            myApp.isOnline = false;
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
        myApp.db = new PouchDB(dbName, {adapter: 'cordova-sqlite'});                        
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
        myApp.db = new PouchDB(dbName);
    }  
    
    // Create or open the remote database to sync to - requires you to start up the PouchDB server 1st (see readme) 
    myApp.remoteDB = new PouchDB("http://localhost:5984/myTodoList");
    
    // Make a call to get the info on each db 
    myApp.db.info().then(function (info) {
        console.log("Local DB info " + JSON.stringify(info));          
    })
    
    myApp.remoteDB.info().then(function (info) {
        console.log("Remote DB info " + JSON.stringify(info));          
    })
    
    // Load existing data (if any)
    myApp.services.pouch.loadData();

    // Turn on live 2-way syncing
    myApp.services.pouch.sync();
    
    // Start processing db changes
    myApp.services.pouch.handleChanges();
    
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
                if (i>0) 
                    tabbar.removeChild(tabs[i]);                
                else document.querySelector('#completedTasksPage').setAttribute('style',"display:block")
            }
        }
    }
});


