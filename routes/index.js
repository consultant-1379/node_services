
/*
 * GET home page.
 */

exports.index = function(req, res){
	console.log('Loading NSStubb UI on '+req.connection.remoteAddress);
  res.render('index', { title: 'NSStubb' , routes: require('../routeutils').listRoutes(), routedata:  require('../routeutils').routeResponseStatic('/NETWORK/ROAMING_ANALYSIS/COUNTRY')});
};