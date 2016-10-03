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
		// Creates a new task and attaches it to the pending task list.
		create: function (data) {	

			console.log("Creating a new task " + data);
			myApp.services.pouch.create(data);
			
			// Task item template.
			var template = document.createElement('div');
			var checked;
			if (data.completed) checked = "checked";
			else checked="";

			template.innerHTML =
				'<ons-list-item tappable category="' + myApp.services.categories.parseId(data.category) + '">' +
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
			// Store data within the element.
			taskItem.data = data;

			// Add 'completion' functionality when the checkbox changes.
			taskItem.data.onCheckboxChange = function (event) {
				myApp.services.animators.swipe(taskItem, function () {
					var listId = (taskItem.parentElement.id === 'pending-list' && event.target.checked) ? '#completed-list' : '#pending-list';
					document.querySelector(listId).appendChild(taskItem);
					taskItem.data.completed = true;
					myApp.services.tasks.update(taskItem,data);
				});
			};

			taskItem.addEventListener('change', taskItem.data.onCheckboxChange);

			// Add button functionality to remove a task.
			taskItem.querySelector('.right').onclick = function () {
				myApp.services.tasks.remove(taskItem);
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

			// Insert urgent tasks at the top and non urgent tasks at the bottom.
			var pendingList = document.querySelector('#pending-list');
			pendingList.insertBefore(taskItem, taskItem.data.urgent ? pendingList.firstChild : null);

			return taskItem;
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
						
			myApp.services.pouch.update(taskItem.data);
		},


		// Deletes a task item and its listeners.
		remove: function (taskItem) {
			taskItem.removeEventListener('change', taskItem.data.onCheckboxChange);
				
			myApp.services.animators.remove(taskItem, function () {
				// Remove the item before updating the categories.
				taskItem.remove();
				myApp.services.pouch.delete(taskItem.data);
			
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

	////////////////////////////////
	// General Database Service
	////////////////////////////////
	pouch: {	
		initAdd: function(item) {
			myApp.db.put(
				item
			).then(function (res) {
				// handle response and retrieve it back with the id returned in the response
				console.log("Response id " +res.id);
				myApp.db.get(res.id);				
			}).then(function (doc) {
				console.log("Doc " + doc);
				// handle the retrieved object
				//console.log('Stored a document! ' + JSON.stringify(doc));
				console.log('Local adapter is: ' + myApp.db.adapter);
			}).catch(function (err) {
				// some error (maybe a 409, because it already exists?)
				if (err.name === 'conflict') {
					console.log("A conflict occurred upon create");
				} else {
					console.log("Error " + err);
				}
			});
		},	
		create: function(item) {
			myApp.db.post(
				item
			).then(function (res) {
				console.log("Response id " +res.id);
				return myApp.db.get(res.id);				
			}).then(function (doc) {								
				console.log('Created document! ' + JSON.stringify(doc));				
			}).catch(function (err) {
				// some error (maybe a 409, because it already exists?)
				if (err.name === 'conflict') {
					console.log("A conflict occurred upon create - item may already exist?" + err);
				} else {
					console.log("Error " + err);
				}
			});
		},
		delete: function(item) {
			myApp.db.get(item._id).then(function(doc) {
				console.log("GOing to delete " + doc.id + " or " + doc._id)
				return myApp.db.remove(doc);
			}).then(function (result) {
				console.log("Remove call result " + result);
			}).catch(function (err) {
				console.log("Remove call error " + err);
			});
		},
		update: function(updatedDoc) {
			myApp.db.get(updatedDoc._id).then(function (origDoc) {
				//doc = updatedDoc;
				updatedDoc.onCheckboxChange="";
				updatedDoc._rev = origDoc._rev;
				updatedDoc._id = origDoc._id;
				return myApp.db.put(updatedDoc);
						
			}).then(function (response) {			
				console.log(response);
			}).catch(function (err) {
				// some error (maybe a 409, because it already exists?)
				if (err.name === 'conflict') {
					console.log("A conflict occurred upon update");
				} else {
					console.log(err);
				}
			}); 			
		},
		fetch: function(item) {
			myApp.db.get(item._id).then(function (doc) {
				return doc;			
			}).then(function (doc) {
				console.log("Fetch result " + doc);
			}).catch(function (err) {
				console.log("Fetch error " + err);
			})
		},		
		fetchAll: function(callback) {
			myApp.db.allDocs({
				include_docs: true,
				attachments: true
			}, function(err, response) {
				if (err) { return console.log(err); }
				else callback(response.rows);				
			});			
		},		
		fetchAllRemote: function(callback) {
			myApp.remoteDB.allDocs({
				include_docs: true,
				attachments: true
			}, function(err, response) {
				if (err) { console.log(err); }
				else callback(response.rows);				
			});
		},
		sync: function() {
			myApp.db.sync(myApp.remoteDB, {
				live: true,
				retry: true
			}).on('change', function (change) {
				console.log("A db change occurred " + JSON.stringify(change));				
			}).on('paused', function () {
				console.log("Replication paused.");				
			}).on('active', function (info) {
				console.log("Replication resumed " + info);				
			}).on('error', function (err) {
				console.log("Sync Error occurred " + err);				
			})
		},		
		close: function() {
			myApp.db.close().then(function () {
				console.log("Database closed")
			})
		},		
		getInfo: function() {
			myApp.db.info().then(function (result) {
				console.log("Logging local database info " + JSON.stringify(result));
			})
			.catch(function (err) {
				console.log(err);
			})
		},		
		fetchAllChanges: function() {
			// All changes since inception
			myApp.db.changes({ since: 0,
				include_docs: true
			}).then(function (changes) {
				console.log("Changes result " + changes);
			}).catch(function (err) {
				console.log("Fetch all changes error " + err);
			});				
		},
		fetchLiveChanges: function() {			
			myApp.db.changes({
				since: 'now'
			}).on('change', function (change) {
				console.log("Fetch live changes error " + change);
			}).on('error', function (err) {
				console.log("Fetch live changes error " + err);
			});
		},
		map: function(doc) {
			function myMapFunction(doc) {
				emit(doc.name);
			}
		},	
		deleteDB: function(db) {
			myApp.db.destroy().then(function (response) {
				console.log("DB " + myApp.db + " deleted ");
			}).catch(function (err) {
				console.log("ERROR on delete db " + myApp.db + " " + err);
			}
		)}
					
	},
	// Initial Data 
	fixtures: [
		{
			_id: "00000001",
			title: 'Book Web Unleashed',
			category: 'Travel',
			description: 'Book trip to Toronto.',
			highlight: false,
			urgent: true
		},		
		{
			_id: "00000002",
			title: 'Call Dentist',
			category: 'Personal',
			description: 'Schedule routine appt.',
			highlight: false,
			urgent: false
		},
		// {
		// 	id: "00000003",
		// 	title: "Carpool turn",
		// 	category: 'Personal',
		// 	description: 'Pickup day for carpool.',
		// 	highlight: false,
		// 	urgent: false
		// },
		// {
		// 	id: "00000004",
		// 	title: 'Write blog post',
		// 	category: 'Work',
		// 	description: 'Some description.',
		// 	highlight: false,
		// 	urgent: false
		// },
		// {
		// 	id: "00000005",
		// 	title: 'Dry cleaners',
		// 	category: 'Personal',
		// 	description: 'Drop off items.',
		// 	highlight: false,
		// 	urgent: false
		// }		
	],
	
};