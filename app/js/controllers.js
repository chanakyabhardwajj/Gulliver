'use strict';

/* Controllers */

angular.module('gulliver.controllers', []).
    controller('searchCtrl', ['$scope', '$location', function ($scope, $location) {
        $scope.origin = "Delhi";
        $scope.destination = "Mumbai";
        $scope.isSearching = false;

        $scope.search = function ($event) {
            if($scope.origin && $scope.destination){
                $location.path('/plan').search({from: $scope.origin, to: $scope.destination});
            }
        }
    }])
    .controller('planCtrl', ['$scope', '$location', '$http', '$sanitize', 'Transport', 'Geocode', 'Weather', 'Wiki', function ($scope, $location, $http, $sanitize, Transport, Geocode, Weather, Wiki) {
        $scope.params = $location.search();
        $scope.transportData = {};
        $scope.swatch = ['#269abc', '#b84d45', '#aecb36', '#34495e'];
        if(($scope.params && $scope.params.from && $scope.params.to)){
            $scope.origin = {
                name : $location.search().from,
                lat : null,
                lng : null,
                wiki : null
            };

            $scope.destination = {
                name : $location.search().to,
                lat : null,
                lng : null,
                wiki : null
            };

            Geocode.get(
                {query:$scope.origin.name},
                function (data) {
                    if(data && data.places && Array.isArray(data.places)){
                        $scope.origin.lat = data.places[0].lat;
                        $scope.origin.lng = data.places[0].lng;
                    }
                    else{
                        throw new Error("Oops. We could not find this place : " + $scope.origin.name);
                    }
                },
                function (data) {
                    throw new Error("Oops. We could not find this place : " + $scope.origin.name);
                }
            );

            Geocode.get(
                {query:$scope.destination.name},
                function (data) {
                    if(data && data.places && Array.isArray(data.places)){
                        $scope.destination.lat = data.places[0].lat;
                        $scope.destination.lng = data.places[0].lng;
                        $scope.weatherData = Weather.query({lat:$scope.destination.lat, lon:$scope.destination.lat});
                    }
                    else{
                        throw new Error("Oops. We could not find this place : " + $scope.destination.name);
                    }
                },
                function (data) {
                    throw new Error("Oops. We could not find this place : " + $scope.destination.name);
                }
            );

            $scope.trnsprtQry = Transport.query({"oName" : $scope.origin.name, "dName" : $scope.destination.name});
            $scope.trnsprtQry.$promise.then(function(data){
                for(var i=0, j=data.routes.length; i<j; i++){
                    var route = data.routes[i];
                    route.routeIndex = i;
                    route.raaste = [];
                    route.routeColor = i<$scope.swatch.length ?  $scope.swatch[i] : "#ffcc00";

                    for(var x=0,y=route.stops.length-1;x<y;x++){
                        if(route.segments[x].kind == "flight"){
                            route.segments[x].decodedPath = [{lat: route.stops[x].pos.split(",")[0], lng: route.stops[x].pos.split(",")[1]}, {lat: route.stops[x+1].pos.split(",")[0], lng: route.stops[x+1].pos.split(",")[1]}]
                        }
                        else{
                            route.segments[x].decodedPath = google.maps.geometry.encoding.decodePath(route.segments[x].path);
                        }

                        var rastaObj={
                            begin : route.stops[x],
                            how : route.segments[x],
                            end : route.stops[x+1]
                        };
                        route.raaste.push(rastaObj);
                    }
                }
                $scope.transportData.routes = data.routes;
                $scope.transportData.selectedRouteIndex = $scope.transportData.routes[0].routeIndex;
                console.log($scope.transportData)
            });

            Wiki.query({title:$scope.origin.name}).$promise.then(function(r){
                if(r && r.query && r.query.pages){
                    var temp = r.query.pages[Object.keys(r.query.pages)[0]];
                    if(temp && temp.extract){
                        $scope.origin.wiki = $sanitize(temp.extract);
                    }
                }
                else{
                    $scope.origin.wiki = "<strong>Looks like Wikipedia does not know about this place! Oops!</strong>";
                }

            });

            Wiki.query({title:$scope.destination.name}).$promise.then(function(r){
                if(r && r.query && r.query.pages){
                    var temp = r.query.pages[Object.keys(r.query.pages)[0]];
                    if(temp && temp.extract){
                        $scope.destination.wiki = $sanitize(temp.extract);
                    }
                }
                else{
                    $scope.destination.wiki = "<strong>Looks like Wikipedia does not know about this place! Oops!</strong>";
                }
            });
        }
        else{
            throw new Error("Something's not right here! Are you sure you have entered the origin and destination?");
        }
    }])
    .controller('transportCtrl', ['$scope', function($scope){
        $scope.isopen = true;

        $scope.selectRoute = function($index){
            $scope.transportData.selectedRouteIndex = $index;
        }
    }])
    .controller('mapCtrl', ['$scope', function($scope){
        $scope.mapData={};
        $scope.mapData.mapId = "abc";
        $scope.mapData.mapOptions = {
            zoom: 5,
            center: new google.maps.LatLng(28.6, 77.2),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            //styles: [{"featureType":"water","stylers":[{"color":"#021019"}]},{"featureType":"landscape","stylers":[{"color":"#08304b"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#0c4152"},{"lightness":5}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#0b434f"},{"lightness":25}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#0b3d51"},{"lightness":16}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#000000"},{"lightness":13}]},{"featureType":"transit","stylers":[{"color":"#146474"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#144b53"},{"lightness":14},{"weight":1.4}]}]
            styles : [{"featureType":"water","stylers":[{"color":"#19a0d8"}]},{"featureType":"administrative","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"},{"weight":6}]},{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#e85113"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#efe9e4"},{"lightness":-40}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#efe9e4"},{"lightness":-20}]},{"featureType":"road","elementType":"labels.text.stroke","stylers":[{"lightness":100}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"lightness":-100}]},{"featureType":"road.highway","elementType":"labels.icon"},{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"landscape","stylers":[{"lightness":20},{"color":"#efe9e4"}]},{"featureType":"landscape.man_made","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"lightness":100}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"lightness":-100}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"hue":"#11ff00"}]},{"featureType":"poi","elementType":"labels.text.stroke","stylers":[{"lightness":100}]},{"featureType":"poi","elementType":"labels.icon","stylers":[{"hue":"#4cff00"},{"saturation":58}]},{"featureType":"poi","elementType":"geometry","stylers":[{"visibility":"on"},{"color":"#f0e4d3"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#efe9e4"},{"lightness":-25}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#efe9e4"},{"lightness":-10}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"simplified"}]}]
        };

        $scope.mapData.mapPolyLineOptions = {
            strokeOpacity: 1.0,
            strokeWeight: 4
        };

        $scope.getPolyLineOptions = function(routeIndx) {
            return angular.extend(
                { strokeColor: $scope.transportData.routes[routeIndx].routeColor },
                $scope.mapData.mapPolyLineOptions
            );
        };



        $scope.getMapBoundsObject = function() {
            var boundsObj = new google.maps.LatLngBounds();
            var myLatLng = new google.maps.LatLng(23,34);
            boundsObj.extend(myLatLng);
            /*if($scope.trnsprtQry.resolved){
                var points= $scope.transportData.routes[$scope.transportData.selectedRouteIndex].stops;
                for (var i = 0; i < points.length; i++) {
                    var point = points[i];
                    var myLatLng = new google.maps.LatLng(point.pos.split(",")[0], point.pos.split(",")[0]);
                    boundsObj.extend(myLatLng);
                }
            }*/
            return boundsObj;
        };


    }]);

