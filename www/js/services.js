/***********************************************************************************
 * App Services. This contains the logic of the application.                       *
 ***********************************************************************************/
myApp.services = {
	///////////////////////
	// Animation Service //
	///////////////////////
	animators: {

		// Swipe animation for task completion.
		swipe: function (listItem, callback) {
			var animation = (listItem.parentElement.id === 'pending-list') ? 'animation-swipe-right' : 'animation-swipe-left';
			listItem.classList.add('hide-children');
			listItem.classList.add(animation);

			setTimeout(function () {
			listItem.classList.remove(animation);
			listItem.classList.remove('hide-children');
			callback();
			}, 950);
		},

		// Remove animation for task deletion.
		remove: function (listItem, callback) {
			listItem.classList.add('animation-remove');
			listItem.classList.add('hide-children');

			setTimeout(function () {
				callback();
			}, 750);
		}
	},

    // Task Service 
    tasks: {
		// Adds a new task to the db, create the UI element and add to pending list 
		addNewTask: function (data) {
			console.log("Creating a new task " + data);			
			myApp.services.pouch.create(data);						
		},		
		// Creates a new task item element. This may be called when a new task is added or when the app opens and the existing 
		// rows are fetched.
		createTaskElem: function (data) {				
			// Task item template.
			var template = document.createElement('div');
			var checked;
			if (data.completed) 
				checked = "checked";
			else checked="";

			template.innerHTML =
				'<ons-list-item id="'+data._id+'"tappable category="' + myApp.services.categories.parseId(data.category) + '">' +
					'<label class="left">' +						
						'<ons-input type="checkbox" '+ checked+'></ons-input>' +												
					'</label>' +
					'<div class="center">' +
						data.title +
					'</div>' +
					'<div class="right">' +
						'<ons-icon style="color: grey; padding-left: 4px" icon="ion-ios-trash-outline, material:md-delete"></ons-icon>' +
					'</div>' +
				'</ons-list-item>'
				;
			
			// Takes the actual task item.
			var taskItem = template.firstChild;
			// Store the data within the element.
			taskItem.data = data;

			// Add 'completion' functionality when the checkbox changes.
			taskItem.data.onCheckboxChange = function (event) {					
				if (event.target.checked==true)
					taskItem.data.completed=true;
				else taskItem.data.completed=false;
				myApp.services.pouch.update(taskItem,taskItem.data);
			};

			taskItem.addEventListener('change', taskItem.data.onCheckboxChange);

			// Add button functionality to remove a task.
			taskItem.querySelector('.right').onclick = function () {
				myApp.services.pouch.delete(taskItem);								
			};

			// Add functionality to push 'details_task.html' page with the current element as a parameter.
			taskItem.querySelector('.center').onclick = function () {
				document.querySelector('#myNavigator')
				.pushPage('views/details_task.html',
				{
					animation: 'lift',
					data: {
						element: taskItem
					}
				}
				);
			};

			// Check if it's necessary to create new categories for this item.
			myApp.services.categories.updateAdd(taskItem.data.category);

			// Add the highlight if necessary.
			if (taskItem.data.highlight) {
				taskItem.classList.add('highlight');
			}			
			
			return taskItem;
		},

		addToPendingList: function(taskItem) {
			// Insert urgent tasks at the top and non urgent tasks at the bottom.
			var pendingList = document.querySelector('#pending-list');
			pendingList.insertBefore(taskItem, taskItem.data.urgent ? pendingList.firstChild : null);
		},

		addToCompletedList: function(taskItem) {
			document.querySelector('#completed-list').appendChild(taskItem);
		},

		// Modifies the inner data and current view of an existing task.
		update: function (taskItem, data) {
			if (data.title !== taskItem.data.title) {
				// Update title view.
				taskItem.querySelector('.center').innerHTML = data.title;
			}

			if (data.category !== taskItem.data.category) {
				// Modify the item before updating categories.
				taskItem.setAttribute('category', myApp.services.categories.parseId(data.category));
				// Check if it's necessary to create new categories.
				myApp.services.categories.updateAdd(data.category);
				// Check if it's necessary to remove empty categories.
				myApp.services.categories.updateRemove(taskItem.data.category);
			}

			// Add or remove the highlight.
			taskItem.classList[data.highlight ? 'add' : 'remove']('highlight');

			// Store the new data within the element.
			taskItem.data = data;
			
			// If this was an update from another client interacting with the list to the remoteDB it will need to be 
			// programmatically checked off and moved to the completed list
			if (taskItem.parentElement.id === 'pending-list' && data.completed) {
				myApp.services.animators.swipe(taskItem, function () { 		
					document.querySelector("#pending-list").removeChild(taskItem);
					taskItem.getElementsByClassName("checkbox")[0].checked=true;
					document.querySelector("#completed-list").appendChild(taskItem);					
				})
			}
			else if (taskItem.parentElement.id === 'completed-list' && !data.completed) {
				myApp.services.animators.swipe(taskItem, function () {
					document.querySelector("#completed-list").removeChild(taskItem);
					if (taskItem.getElementsByClassName("checkbox")[0].checked)
						taskItem.getElementsByClassName("checkbox")[0].checked=false;
					document.querySelector("#pending-list").appendChild(taskItem);
				})
			}			
		},


		// Deletes a task item and its listeners.
		removeTaskElem: function (taskItem) {
			taskItem.removeEventListener('change', taskItem.data.onCheckboxChange);
				
			myApp.services.animators.remove(taskItem, function () {
				// Remove the item before updating the categories.
				taskItem.remove();
				if (taskItem.parentElement!=null) {
					taskItem.parentElement.remove(taskItem);
				}
				
				// Check if the category has no items and remove it in that case.
				myApp.services.categories.updateRemove(taskItem.data.category);
			});	
								
		}
    },

    //////////////////////
    // Category Service //
    //////////////////////
    categories: {

		// Creates a new category and attaches it to the custom category list.
		create: function (categoryLabel) {
			var categoryId = myApp.services.categories.parseId(categoryLabel);

			// Category item template.
			var template = document.createElement('div');
			template.innerHTML =
			'<ons-list-item tappable category-id="' + categoryId + '">' +
				'<div class="left">' +
					'<ons-input type="radio" name="categoryGroup" input-id="radio-' + categoryId + '"></ons-input>' +
				'</div>' +
				'<label class="center" for="radio-' + categoryId + '">' +
					(categoryLabel || 'No category') +
				'</label>' +
			'</ons-list-item>'
			;

			// Takes the actual category item.
			var categoryItem = template.firstChild;

			// Adds filtering functionality to this category item.
			myApp.services.categories.bindOnCheckboxChange(categoryItem);

			// Attach the new category to the corresponding list.
			document.querySelector('#custom-category-list').appendChild(categoryItem);
		},

		// On task creation/update, updates the category list adding new categories if needed.
		updateAdd: function (categoryLabel) {
			var categoryId = myApp.services.categories.parseId(categoryLabel);
			var categoryItem = document.querySelector('#menuPage ons-list-item[category-id="' + categoryId + '"]');

			if (!categoryItem) {
				// If the category doesn't exist already, create it.
				myApp.services.categories.create(categoryLabel);
			}
		},

		// On task deletion/update, updates the category list removing categories without tasks if needed.
		updateRemove: function (categoryLabel) {
			var categoryId = myApp.services.categories.parseId(categoryLabel);
			var categoryItem = document.querySelector('#tabbarPage ons-list-item[category="' + categoryId + '"]');

			if (!categoryItem) {
				// If there are no tasks under this category, remove it.
				myApp.services.categories.remove(document.querySelector('#custom-category-list ons-list-item[category-id="' + categoryId + '"]'));
			}
		},

		// Deletes a category item and its listeners.
		remove: function (categoryItem) {
			if (categoryItem) {
				// Remove listeners and the item itself.
				categoryItem.removeEventListener('change', categoryItem.updateCategoryView);
				categoryItem.remove();
			}
		},

		// Adds filtering functionality to a category item.
		bindOnCheckboxChange: function (categoryItem) {
			var categoryId = categoryItem.getAttribute('category-id');
			var allItems = categoryId === null;

			categoryItem.updateCategoryView = function () {
				var query = '[category="' + (categoryId || '') + '"]';

				var taskItems = document.querySelectorAll('#tabbarPage ons-list-item');
				for (var i = 0; i < taskItems.length; i++) {
					taskItems[i].style.display = (allItems || taskItems[i].getAttribute('category') === categoryId) ? '' : 'none';
				}
			};

			categoryItem.addEventListener('change', categoryItem.updateCategoryView);
		},

		// Transforms a category name into a valid id.
		parseId: function (categoryLabel) {
			return categoryLabel ? categoryLabel.replace(/\s\s+/g, ' ').toLowerCase() : '';
		}		 
	},

	// Database Services using pouchDB 
	pouch: {					
		create: function(item) {
			myApp.db.post(item).then(function (response) {
				console.log("Response id " + response.id + " item " + item);						
			}).catch(function (err) {
				console.log(err.name==='conflict'?"Conflict occurred - possible duplicate ":"Error " + err);				
			});
		},
		delete: function(taskItem) {
			myApp.db.remove(taskItem.data).then(function(response) {
				console.log("Remove item response " + JSON.stringify(response));
			}).catch(function (err) {
				console.log("Remove error " + err);
			});
		},		
		update: function(taskItem,updatedDoc) {			
			myApp.db.get(updatedDoc._id).then(function (origDoc) {
				updatedDoc.onCheckboxChange="";
				console.log("Updated doc rev "+ updatedDoc._rev); 
				console.log("Original doc rev "+ origDoc._rev)
				myApp.db.put(updatedDoc).catch(function (err) { 
					console.log(err);				
				})				
			}) 			
		},				
		loadData: function(callback) {
			myApp.db.allDocs({ include_docs: true, attachments: true}, function(err, response) {
				if (err) console.log(err); 
				var rows = response.rows;				
				for (var i=0; i<rows.length; i++) {					
					var taskItem = myApp.services.tasks.createTaskElem(rows[i].doc);
					if (rows[i].doc.completed) 
						myApp.services.tasks.addToCompletedList(taskItem);
					else myApp.services.tasks.addToPendingList(taskItem);
				}								
			});
		},		
		handleChanges: function() {
			myApp.db.changes({ since: 'now', live: true, include_docs: true}).on('change', function(change) {
				console.log("Processing db change " + JSON.stringify(change));	
				var taskItem = document.getElementById(change.id);
				if (taskItem!=null) {
					if (change.deleted)
						myApp.services.tasks.removeTaskElem(taskItem);
					else myApp.services.tasks.update(taskItem,change.doc);
				}
				else {
					var taskItem = myApp.services.tasks.createTaskElem(change.doc);
					if (change.doc.completed) 
						myApp.services.tasks.addToCompletedList(taskItem);
					else myApp.services.tasks.addToPendingList(taskItem);					
				} 		
			}).on('error', function (err) {
				console.log(err);
			});
		},
		sync: function() {
			myApp.db.sync(myApp.remoteDB, {
				live: true,
				retry: true
			}).on('change', function (result) {
				console.log("A db change occurred " + JSON.stringify(result));																	
			}).on('paused', function () {
				console.log("Replication paused ");				
			}).on('active', function (info) {
				console.log("Replication resumed " + JSON.stringify(info));				
			}).on('error', function (err) {
				console.log("Sync Error occurred " + err);				
			})
		},		
		close: function() {
			myApp.db.close().then(function () {
				console.log("Local database closed")
			})
			myApp.remoteDB.close().then(function () {
				console.log("Remote database closed")
			})
		},							
		deleteDB: function(db) {
			myApp.db.destroy().then(function (response) {
				console.log("Database deleted " + response);
			}).catch(function (err) {
				console.log("Error on database delete " + err);
			}
		)}					
	}	
};


