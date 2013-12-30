'use strict';

/* Directives */

angular.module('gulliver.directives', [])
    .directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }])
    .directive('routeheading', function() {
        return {
            restrict: 'ECMA',
            replace: false,
            template :
                '<div class="routeName  routeHeaderItem col-xs-5">{{route.name}}</div>' +
                '<div class="routePrice routeHeaderItem col-xs-5">{{route.indicativePrice.price + " " + route.indicativePrice.currency}}</div>' +
                /*'<div class="routeTime  routeHeaderItem col-xs-3"><i class="fa fa-clock-o"></i> {{route.duration}} mins</div>' +
                '<div class="routeDist  routeHeaderItem col-xs-3"><i class="fa fa-arrows-h"></i> {{route.distance}} kms</div>' +*/
                '<i class="col-xs-2 glyphicon" ng-class="{\'glyphicon-chevron-down\': isopen, \'glyphicon-chevron-right\': !isopen}"></i>'

        };
    })
    .directive('raastadir', function() {
        return {
            restrict: 'ECMA',
            replace: false,
            template :  '<div class="raastaHow raastaItem col-xs-12">{{raasta.how.kind | uppercase}} : </div>' +
                '<em class="raastaBegin raastaItem">{{raasta.begin.name}} <small>{{raasta.begin.kind}}</small></em>' +
                /*'<i class="fa fa-arrow-right col-xs-1"></i>'*/ 'to' +
                '<em class="raastaEnd raastaItem">{{raasta.end.name}} <small>{{raasta.end.kind}}</small></em>'

        };
    });
