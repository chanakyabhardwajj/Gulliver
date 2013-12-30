'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('gulliver.services', ['ngResource']).
    value('version', '0.1')
    .factory("Transport", ['$resource', function ($resource) {
        return $resource('http://free.rome2rio.com/api/1.2/json/Search/', {key : '9KNFHaKz'}, {
            query : {method : 'GET', params : {}, isArray : false}
        });
    }])
    .factory("Geocode", ['$resource', function ($resource) {
        return $resource('http://free.rome2rio.com/api/1.2/json/Geocode/', {key : '9KNFHaKz'}, {
            query : {method : 'GET', params : {}, isArray : false}
        });
    }])
    .factory("Weather", ['$resource', function ($resource) {
        return $resource('http://api.openweathermap.org/data/2.5/forecast/daily?cnt=10&mode=json', {}, {
            query: { method: 'JSONP', params: {callback: 'JSON_CALLBACK'}, isArray: false }
        });
    }])
    .factory("Wiki", ['$resource', function ($resource) {
        return $resource('http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=:title', {title:'@title'}, {
            query: { method: 'JSONP', params: {callback: 'JSON_CALLBACK'}, isArray: false }
        });
    }]);