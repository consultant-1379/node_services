var assert = require("assert");
var should = require("should");
var routeUtils = require("../routeutils");

var request = {};
var response = {
    viewName: ""
    , data : {}
    , render: function(view, viewData) {
        viewName = view;
        data = viewData;
    }
};

describe('RouteUtils', function(){
	describe('isRouteExisting', function(){
		it('should detect that the route: /METADA/U is not present', function(){
			var result = routeUtils.isRouteExisting('/METADATA/U');
			result.should.be.false;
		});
		it('should detect that the route: /METADA/UI is present', function(){
			var result = routeUtils.isRouteExisting('/METADATA/UI');
			result.should.be.true;
		})
	});
	describe('addRoute', function(){
		it('should add, then remove the route /test/test/test with data', function(){
			var data = {"delay": true, "delayms": "23", "routedata": '{"test":false}'};
			var route = '/test/test/test';
			routeUtils.addRoute(route, data);
			var result = routeUtils.isRouteExisting(route);
			result.should.be.true;
			routeUtils.removeRoute(route);
			result = routeUtils.isRouteExisting(route);
			result.should.be.false;
		})
	})
})