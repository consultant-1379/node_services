var fs = require('fs'),
  path = require('path');

//Constructor for a route.
exports.route = function(route, file, template, realTime){
	// console.log('---- route Constructor');
	this.route = route;
	this.file = file;
	this.template = template;
	this.realTime = realTime;
}

//Check to see if the route exists in the JSON configuration file.
exports.isRouteExisting = function(route){
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));
	var content = JSON.parse(fileContent);

	for (var i = content.routes.length - 1; i >= 0; i--) {
		if (route === content.routes[i].route) {
			return true;
		};
	};

	return false;
}

//Remove the route from the JSON configuration file.
exports.removeRoute = function(route){
	var regex = new RegExp("/", 'g');
	var fileName = route;
	fileName = fileName.replace(regex, '_');
	fileName = '/response/'+fileName+'.json';
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));
	var content = JSON.parse(fileContent);

	for (var i = content.routes.length - 1; i >= 0; i--) {
		if (route === content.routes[i].route) {
			content.routes.splice(i,1);
			fs.writeFileSync(require('path').resolve(__dirname+'/routes/routes.json'), JSON.stringify(content, null, '\t'));

			//unlink this route
			fs.unlink(path.resolve(__dirname+fileName), function(){
				//do nothing...
			});
			
			return true;
		};
	};
	return false;
}

//Read the  JSON and extract the routes and the files they point to.
exports.toString = function(){
	// console.log('some function');
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));
	var content = JSON.parse(fileContent);
	var result = '';
	for (var i = 0; i < content.routes.length; i++) {
		result = result + i + '. ' + content.routes[i].route + ' -> ' +  content.routes[i].file + '<br>';
	};
	return result;	
}

exports.allRoutes = function(){
	// console.log('ALL ROUTES -->');
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));
	return JSON.parse(fileContent);
}

/*
 * Called everytime a request is made to NSStubb from external source.
 * @route: The requested route
 * @updateCount: boolean, (true -> update the number of times this route was called)
 */
exports.getRoute = function(route, updateCount){
	// console.log('GET ROUTE: '+route+ ': '+updateCount);
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));
	var content = JSON.parse(fileContent);
	for (var i = 0; i < content.routes.length; i++) {
		if(route === content.routes[i].route){
			if(updateCount){
				content.routes[i].uses = content.routes[i].uses + 1;
				fs.writeFileSync(require('path').resolve(__dirname+'/routes/routes.json'), JSON.stringify(content, null, '\t'));
			}
			return content.routes[i];
		}
	}
	return null;
}

/*
 * Called to list the available routes defined by the user. 
 * Returns a list of route objects.
 */
exports.listRoutes = function(){
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));
	var content = JSON.parse(fileContent);
	var _routes = new Array();

	for (var i = 0; i < content.routes.length; i++) {
		_routes.push(content.routes[i].route);
	};
	return _routes;	
}

/*
 * Called when the user chooses a new route in the NSStubb UI. 
 * Returns an object which is then displayed in the NSStub UI.
 */
exports.routeResponseStatic = function(route){
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));

	//contents of routes.json
	var content = JSON.parse(fileContent);

	for (var i = 0; i < content.routes.length; i++) {
		if(route === content.routes[i].route){
			var data;
			try{
				data = JSON.parse(fs.readFileSync(path.resolve(__dirname+content.routes[i].file)));
				data = JSON.stringify(data, null, '\t');
			}catch(exception){
				//not a valid JSON, just return the contents of the file.
				data = fs.readFileSync(path.resolve(__dirname+content.routes[i].file), 'utf8');
			}
			var uses = content.routes[i].uses;
			var realTime = content.routes[i].realTime;
			var delay = content.routes[i].delay;
			var delayms = content.routes[i].delayms;
			var httpMethod = content.routes[i].httpMethod;

			return {"delay":delay, "delayms":delayms, "realTime":realTime, "uses":uses, "data":data, "httpMethod":httpMethod};
			// return jsonRsp;
		}
	}
}

exports.isDelay = function(route){
	// console.log('IS DELAY -->');
	// console.log('ROUTE = '+route);	
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));
	//contents of routes.json
	var content = JSON.parse(fileContent);

	for (var i = 0; i < content.routes.length; i++) {
		if(route === content.routes[i].route){
			try{
				var content = content.routes[i].delay;
				// console.log('FOUND DELAY = '+content);
				return content;
			}catch(e){
				// console.log("isDelay:ERROR");
				return false;
			}
		}
	}
}

//Modify an existing route
exports.modifyRoute = function(data){
		//console.log('MODIFY ROUTE ('+data.route+') -->');
		var route = data.route;
		var routedata = data.routedata;
	//get the name of the file to modify...
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));
	var content = JSON.parse(fileContent);
	for (var i = 0; i < content.routes.length; i++) {
		if(route === content.routes[i].route){
			content.routes[i].delayms = data.delayms;
			if(data.delay == 'true'){
				content.routes[i].delay = true;
			}else{
				content.routes[i].delay = false;
			}
			fs.writeFileSync(require('path').resolve(__dirname+'/routes/routes.json'), JSON.stringify(content, null, '\t'));
			fs.writeFile(path.resolve(__dirname+content.routes[i].file), routedata, function(){
				//do nothing...
			});
			break;//you've modified the route, stop searching...
		}
	}
}

//Modify an existing route
exports.toggleDelay = function(data){
		// console.log('TOGGLE DELAY -->');
		var route = data.route;
		var delay = data.delay;
		var delayms = data.delayms;
	//get the name of the file to modify...
	var fileContent = fs.readFileSync(path.resolve(__dirname+'/routes/routes.json'));
	var content = JSON.parse(fileContent);
	for (var i = 0; i < content.routes.length; i++) {
		if(route === content.routes[i].route){
			content.routes[i].delayms = data.delayms;
			if(data.delay == 'true'){
				content.routes[i].delay = true;
			}else{
				content.routes[i].delay = false;
			}
			fs.writeFileSync(require('path').resolve(__dirname+'/routes/routes.json'), JSON.stringify(content, null, '\t'));
		}
	}
}

/*
 * Called when the user adds a new route. 
 * @routeString: the route to add.
 * @data: the data to add.
 */
exports.addRoute = function(routeString, data){
	var regex = new RegExp("/", 'g');
	var fileName = routeString;
	fileName = fileName.replace(regex, '_');
	fileName = '/response/'+fileName+'.json';

	var delay = false;
	if(data.delay == 'true'){
		delay = true;
	}
	
	console.log('Added route with method: '+data.httpmethod);

	var _route = new RouteExt(routeString, fileName, '', false, delay, data.delayms, data.httpmethod);

	//update the routes.json with new route... 
	var fileContent = fs.readFileSync(require('path').resolve(__dirname+'/routes/routes.json'));
	var content = JSON.parse(fileContent);
	content.routes.push(_route);
	fs.writeFileSync(require('path').resolve(__dirname+'/routes/routes.json'), JSON.stringify(content, null, '\t'));

	//update the data file for the response...
	fs.writeFile(path.resolve(__dirname+fileName), data.routedata, function(){
				//do nothing...
			});
	return _route;
}

function RouteExt(route, file, template, realTime, delay, delayms, httpMethod){
	this.route = route;
	this.file = file;
	this.template = template;
	this.realTime = realTime;
	this.delay = delay;
	this.delayms = delayms;
	this.uses = 0;
	this.httpMethod = httpMethod;
}
