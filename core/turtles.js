/*
 * This turtle manager is the core of the flatturtle framework. 
 * It lets you create turtle objects and allows event manipulation.
 */

function TurtleManager() {
	modules = {};
	instances = {};

	// trigger an event for one or all turtles
	this.trigger = function(iid, event) {
		if (event == null) {
			event = iid;
			_(instances).each(function(instance, iid) {
				if (typeof instance.collection == "object")
					instance.collection.trigger(event);
				if (typeof instance.view == "object")
					instance.view.trigger(event);
			});
		} else {
			if (instance = instances[iid]) {
				if (typeof instance.collection == "object")
					instance.collection.trigger(event);
				if (typeof instance.view == "object")
					instance.view.trigger(event);
			}
		}
	}

	// bind an external function to an event for one or all turtles
	this.bind = function(iid, event, func) {
		if (func == null) {
			func = event;
			event = iid;
			_(instances).each(function(instance, iid) {
				if (typeof instance.collection == "object")
					instance.collection.bind(event, func);
				if (typeof instance.view == "object")
					instance.view.bind(event, func);
			});
		} else {
			if (instance = instances[iid]) {
				if (typeof instance.collection == "object")
					instance.collection.bind(event, func);
				if (typeof instance.view == "object")
					instance.view.bind(event, func);
			}
		}
	}

	// register a turtle module
	this.register = function(id, module) {
		if (modules[id] != null)
			console.log("turtle already registered");
		else if (typeof module != "object")
			console.log("cannot register turtle '" + id + "', invalid module");
		else
			modules[id] = module;
		
		return true;
	}

	// check if a turtle is registered
	this.registered = function(id) {
		return modules[id] != null;
	}

	// creates turtle instances
	this.instantiate = function(id, options) {
		if (modules[id] == null)
			console.log("turtle does not exist");
		else {
			// generate unique instance id
			var iid = id + "_" + Math.random().toString(36).substr(6);

			if (options == null || typeof options != "object")
				options = {};

			// fetch module description
			module = modules[id];

			var instance = {};

			// save module name
			instance.module = id;

			// construct model
			instance.model = module.model;

			// construct collection
			if (typeof module.collection == "function") {
				if (module.models != null && module.models.constructor == Array)
					instance.collection = new module.collection(module.models, options);
				else
					instance.collection = new module.collection(null, options);
			} else if (typeof module.collection == "object") {
				instance.collection = module.collection;
				instance.models = module.models;
			}
			
			// check if model is assigned
			if (instance.collection != null && instance.collection.model == null && instance.model != null)
				instance.collection.model = instance.model;

			// assign options to collection if not set
			if(instance.collection != null)
				instance.collection.options = options;

			// construct view
			if (typeof module.view == "function") {
				instance.view = new module.view(_.extend(options, {
					collection : instance.collection,
					model : instance.model
				}));
			} else if (typeof module.view == "object") {
				instance.view = module.view;

				if (instance.view.collection == null)
					instance.view.collection = instance.collection;

				if (instance.view.model == null)
					instance.view.model = instance.model;

				// override el with el passed by options
				if (options.el != null)
					instance.view.el = options.el;

				// add options to view
				instance.view.options = _.extend(instance.view.options, options);
			}

			instances[iid] = instance;
			this.trigger(iid, "born");

			return iid;
		}
		return false;
	}

	// destroy a turtle instance, the 'destroy' event is triggered on the turtle
	this.destroy = function(iid) {
		if (instance = instances[iid]) {
			instance.trigger(iid, "destroy");
			if (instance.collection != null
					&& instance.collection.models != null) {
				_(instance.collection.models).each(function(model) {
					model.destroy();
				});
			}
			delete instance.collection;
			delete instance.view;
			delete instance.model;
			delete instances[iid];
		}
	}
}

// basic grow function, we override this in our custom loader
TurtleManager.prototype.grow = function(id, options) {
	return this.instantiate(id, options);
}