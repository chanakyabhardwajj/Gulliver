'use strict';

// Declare app level module which depends on filters, and services
angular.module('gulliver', [
        'ui.bootstrap',
        'ui.keypress',
        'ngRoute',
        'ngSanitize',
        'ngProgress',
        'ngAutocomplete',
        'gulliver.filters',
        'gulliver.services',
        'gulliver.directives',
        'gulliver.controllers'
    ]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/search', {templateUrl : 'partials/search.html', controller : 'searchCtrl'});
        $routeProvider.when('/plan', {templateUrl : 'partials/plan.html', controller : 'planCtrl'});
        $routeProvider.otherwise({redirectTo : '/search'});
    }]);
