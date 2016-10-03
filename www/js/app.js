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
document.addEventListener('deviceready', function () {
    console.log("device ready event fired");        
    
    // Setup PouchDB only on device ready
    PouchDB.plugin(PouchAdapterCordovaSqlite);
    
    // Local database
    if (ons.platform.isIOS() || ons.platform.isAndroid())
        myApp.db = new PouchDB('tasks.db', {adapter: 'cordova-sqlite'});
    else myApp.db = new PouchDB('tasks.db');  
    
    // Create the remote database to sync to 
    myApp.remoteDB = new PouchDB("http://localhost:15984/tasks");

    // Log the info for each
    myApp.db.info().then(function (info) {
        console.log("Local DB " + JSON.stringify(info));
    })
    myApp.remoteDB.info().then(function (info) {
        console.log("Remote DB " + JSON.stringify(info));
    })

    // Fetch the existing rows
    myApp.services.pouch.fetchAllRemote(function(rows) {
        for (var i=0; i<rows.length; i++) {
            var taskItem = myApp.services.tasks.create(rows[i].doc);
            if (rows[i].doc.completed) {
                document.querySelector('#completed-list').appendChild(taskItem);
            }
        }
    })
    
    // Turn on live syncing
    myApp.services.pouch.sync();
    
});
