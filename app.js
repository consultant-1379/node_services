
/**
 * Module dependencies.
 * Created by Kenneth Browne.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , routes = require('./routes')
  , fs     = require('fs')
  , routeUtil = require('./routeutils');

var app = express();
var server = http.createServer(app);
var io  = require('socket.io').listen(server);

var activePort = 3000;

if (undefined != process.argv[2] && null != process.argv[2] && !isNaN(parseInt(process.argv[2]))){
  activePort = process.argv[2]  
}
                
// Configuration
  app.set('port', process.env.PORT || activePort+1);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  io.set('log level', 1); // reduce logging
  // app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + 'public' }));
  app.use(express.static(path.join(__dirname, 'public')));

//some variables:
var files = fs.readdirSync('routes');

//Do some checking to see if the req
try{
  fs.statSync(path.resolve(__dirname+'/routes/routes.json'));  
}catch(err){
  console.log('No routes found. Add routes via the UI http://localhost:'+process.env.PORT);
  fs.openSync(path.resolve(__dirname+'/routes/routes.json'), 'w');
  fs.writeFileSync(path.resolve(__dirname+'/routes/routes.json'), '{"routes": []}');
}

// Routes

var allRoutes = routeUtil.allRoutes();
for (var i = 0; i < allRoutes.routes.length; i++) {  
  //if the route is a POST
  if(allRoutes.routes[i].httpMethod == 'POST'){
    console.log('Add POST request' +allRoutes.routes[i].route);

    app.post(allRoutes.routes[i].route, function(request,response){
      console.log("GOT A POST REQUEST: "+request.url); 
      
      response.set('Access-Control-Allow-Origin', '*');
      var routeObj = require('./routeutils').getRoute(request.path, true);
      if(routeObj === null){
      //send back 404 response.
      io.sockets.emit('activity', {activity: request._parsedUrl.pathname, query: request._parsedUrl.query, ui: request.connection.remoteAddress, code: 404});
      response.send(404, { error: 'Route does not exist' });
    }else{
      io.sockets.emit('activity', {activity: request._parsedUrl.pathname, query: request._parsedUrl.query, ui: request.connection.remoteAddress, code: 200});
      if(routeObj.delay){
        setTimeout(function(){
          response.sendfile(require('path').resolve(__dirname+routeObj.file));
        }, routeObj.delayms);
      }else{
        // response.set('Access-Control-Allow-Origin', '*');
        response.sendfile(require('path').resolve(__dirname+routeObj.file));  
      }
    }

    });
  }else{
    console.log('Add GET request' +allRoutes.routes[i].route);
     
    app.get(allRoutes.routes[i].route, function(request, response){
      console.log('app.get allRoutes --->');
      response.set('Access-Control-Allow-Origin', '*');
      var routeObj = require('./routeutils').getRoute(request.path, true);
      console.log('route is: '+routeObj);
      if(routeObj === null){
        //send back 404 response.
        io.sockets.emit('activity', {activity: request._parsedUrl.pathname, query: request._parsedUrl.query, ui: request.connection.remoteAddress, code: 404});
        response.send(404, { error: 'Route does not exist' });
      }else{
        io.sockets.emit('activity', {activity: request._parsedUrl.pathname, query: request._parsedUrl.query, ui: request.connection.remoteAddress, code: 200});
        if(routeObj.delay){
          setTimeout(function(){
            response.sendfile(require('path').resolve(__dirname+routeObj.file));
          }, routeObj.delayms);
        }else{
          // response.set('Access-Control-Allow-Origin', '*');
          response.sendfile(require('path').resolve(__dirname+routeObj.file));  
        }
      }
    }); 
  }

};

app.use(function(req, res, next){
  res.status(404);
  if (req.url === '/j_security_check') {
    console.log("INFO: Ignoring missing route: "+req.url);
  }else{
    console.log(req._parsedUrl.pathname);
    io.sockets.emit('activity', {activity: req._parsedUrl.pathname, query: req._parsedUrl.query, ui: req.connection.remoteAddress, code: 404});  
  }
  res.set('Access-Control-Allow-Origin', '*');
  res.type('txt').send('Not Found');
});

//render the UI.
app.get('/', function(req, res){
  res.render('index', { title: 'NSStubb' , routes: routeUtil.listRoutes(), routedata:  routeUtil.routeResponseStatic('/NETWORK/ROAMING_ANALYSIS/COUNTRY')});
})


app.get('/404', function(req, res, next){
  next();
});

//put settings into store. 
app.put('/USER/SETTINGS', function(req, res){
  var data = new Object();
  data.route = req.route.path;
  data.routedata = req.body.settings;
  routeUtil.modifyRoute(data);
});

app.post('/deleteroute', function(req,res){
  var selectedRoute = req.body.route;
  routeUtil.removeRoute(req.body.route);
  res.send('route_deleted');
});

app.post('/updateroute', function(req,res){
  routeUtil.modifyRoute(req.body);
  res.send('route_updated');
});

app.post('/toggledelay', function(req,res){
  routeUtil.toggleDelay(req.body);
  res.send('route_updated');
});

app.post('/addroute', function(req,res){
  var selectedRoute = req.body.newroute;
  var modifiedData  = req.body.routedata;
  
  res.set('Access-Control-Allow-Origin', '*');

  if(routeUtil.isRouteExisting(selectedRoute)){
    // res.set('Access-Control-Allow-Origin', '*');
    res.send(500, { error: 'something blew up' });
  }else{
   
    var route = routeUtil.addRoute(selectedRoute, req.body);

    if(route.httpMethod == 'GET'){
      app.get(selectedRoute, function(request, response){
        var routeObj = require('./routeutils').getRoute(request.path, false);
        if(routeObj === null){

        io.sockets.emit('activity', {activity: request._parsedUrl.pathname, query: request._parsedUrl.query, ui: request.connection.remoteAddress, code: 404});
        response.send(404, { error: 'Route does not exist' });
        }else{
          console.log('Is there a time delay: '+routeObj.delay);
          io.sockets.emit('activity', {activity: request._parsedUrl.pathname, query: request._parsedUrl.query, ui: request.connection.remoteAddress, code:200});
          if(routeObj.delay){
            setTimeout(function(){response.sendfile(require('path').resolve(__dirname+routeObj.file))}, routeObj.delayms);
          }else{
            response.set('Access-Control-Allow-Origin', '*');
            response.sendfile(require('path').resolve(__dirname+routeObj.file));  
          }
        }
      });
    }else{
        app.post(selectedRoute, function(request, response){
        var routeObj = require('./routeutils').getRoute(request.path, false);
        if(routeObj === null){

        io.sockets.emit('activity', {activity: request._parsedUrl.pathname, query: request._parsedUrl.query, ui: request.connection.remoteAddress, code: 404});
        response.send(404, { error: 'Route does not exist' });
        }else{
          console.log('Is there a time delay: '+routeObj.delay);
          io.sockets.emit('activity', {activity: request._parsedUrl.pathname, query: request._parsedUrl.query, ui: request.connection.remoteAddress, code:200});
          if(routeObj.delay){
            setTimeout(function(){response.sendfile(require('path').resolve(__dirname+routeObj.file))}, routeObj.delayms);
          }else{
            response.set('Access-Control-Allow-Origin', '*');
            response.sendfile(require('path').resolve(__dirname+routeObj.file));  
          }
        }
      });
    }
 
    res.send('route_added');
  }
});

app.get('/routedata', function(req,res){
  var _route = req.query.route;
  res.type('json');
  res.set('Access-Control-Allow-Origin', '*');
  res.send(routeUtil.routeResponseStatic(_route));
});

io.sockets.on('connection', function(socket){
  console.log('Client is connected :)');
  io.sockets.emit('nsstubb_connected', {message: 'NSStubb is live streaming on port:', port:activePort});
});

server.listen(activePort);
