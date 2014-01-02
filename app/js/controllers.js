'use strict';

/* Controllers */

angular.module('gulliver.controllers', ['ngAutocomplete'])
    .controller('searchCtrl', ['$scope', '$location', function ($scope, $location) {
        $scope.isErrored = false;
        $scope.origin = {};
        $scope.origindetails = {};
        $scope.destination = {};
        $scope.destinationdetails = {};

        $scope.$watch('origindetails', function (details) {
            if (details.name) {
                $scope.origin.name = details.name;
                $scope.origin.lat = details.geometry.location.nb;
                $scope.origin.lng = details.geometry.location.ob;
            }
        });

        $scope.$watch('destinationdetails', function (details) {
            if (details.name) {
                $scope.destination.name = details.name;
                $scope.destination.lat = details.geometry.location.nb;
                $scope.destination.lng = details.geometry.location.ob;
            }
        });

        $scope.search = function ($event) {
            if ($scope.origin.name && $scope.origin.lat && $scope.origin.lng && $scope.destination.name && $scope.destination.lat && $scope.destination.lng) {
                $scope.isErrored = false;
                $location.path('/plan').search({
                    from : $scope.origin.name,
                    to : $scope.destination.name,
                    p1 : $scope.origin.lat,
                    p2 : $scope.origin.lng,
                    p3 : $scope.destination.lat,
                    p4 : $scope.destination.lng
                });
            }
            else {
                $scope.isErrored = true;
            }
        }
    }])
    .controller('planCtrl', ['$scope', '$location', '$http', '$q', '$sanitize', 'ngProgress', 'Transport', 'Geocode', 'Weather', 'Wiki', function ($scope, $location, $http, $q, $sanitize, ngProgress, Transport, Geocode, Weather, Wiki) {
        $scope.params = {};
        $scope.transportData = {};
        $scope.swatch = ['#269abc', '#b84d45', '#aecb36', '#34495e', "#d35400", "#1abc9c", "#2980b9", "#7f8c8d", "#f1c40f", "#d35400", "#27ae60"];

        $scope.origin = {
            name : ($location.search()).from,
            lat : ($location.search()).p1,
            lng : ($location.search()).p2,
            weather : ""
        };

        $scope.destination = {
            name : ($location.search()).to,
            lat : ($location.search()).p3,
            lng : ($location.search()).p4,
            weather : ""
        };

        $scope.trnsprtQry = null;
        $scope.trnsprtQryResolved = false;

        $scope.init = function () {
            ngProgress.start();
            $scope.trnsprtQry = Transport.query({
                "oName" : $scope.origin.name,
                "dName" : $scope.destination.name,
                "oPos" : $scope.origin.lat + "," + $scope.origin.lng,
                "dPos" : $scope.destination.lat + "," + $scope.destination.lng
            });

            $scope.trnsprtQry.$promise.then(function (data) {
                ngProgress.complete();
                $scope.trnsprtQryResolved = true;
                for (var i = 0, j = data.routes.length; i < j; i++) {
                    var route = data.routes[i];
                    route.routeIndex = i;
                    route.raaste = [];
                    route.routeColor = i < $scope.swatch.length ? $scope.swatch[i] : "#EE9E47";

                    for (var x = 0, y = route.stops.length - 1; x < y; x++) {
                        if (route.segments[x].kind == "flight") {
                            route.segments[x].decodedPath = [
                                new google.maps.LatLng(route.stops[x].pos.split(",")[0], route.stops[x].pos.split(",")[1]),
                                new google.maps.LatLng(route.stops[x + 1].pos.split(",")[0], route.stops[x + 1].pos.split(",")[1])
                            ];

                            route.segments[x].startPoint = new google.maps.LatLng(route.stops[x].pos.split(",")[0], route.stops[x].pos.split(",")[1]);
                            route.segments[x].endPoint = new google.maps.LatLng(route.stops[x + 1].pos.split(",")[0], route.stops[x + 1].pos.split(",")[1]);
                        }
                        else {
                            route.segments[x].decodedPath = google.maps.geometry.encoding.decodePath(route.segments[x].path);
                            route.segments[x].startPoint = new google.maps.LatLng(route.segments[x].sPos.split(",")[0], route.segments[x].sPos.split(",")[1]);
                            route.segments[x].endPoint = new google.maps.LatLng(route.segments[x].tPos.split(",")[0], route.segments[x].tPos.split(",")[1]);
                        }

                        var rastaObj = {
                            begin : route.stops[x],
                            how : route.segments[x],
                            end : route.stops[x + 1]
                        };
                        route.raaste.push(rastaObj);
                    }
                }
                $scope.transportData.routes = data.routes;
                $scope.transportData.selectedRouteIndex = $scope.transportData.routes[0].routeIndex;
                $scope.transportData.selectedSegmentIndex = -1;
            });

            Wiki.query({title : $scope.origin.name}).$promise.then(function (r) {
                if (r && r.query && r.query.pages) {
                    if (Object.keys(r.query.pages)[0] == -1) {
                        $scope.origin.wiki = "<strong>Looks like Wikipedia does not know about this place! Oops!</strong>";
                    }
                    else {
                        var temp = r.query.pages[Object.keys(r.query.pages)[0]];
                        if (temp && temp.extract) {
                            $scope.origin.wiki = $sanitize(temp.extract);
                        }
                        else {
                            $scope.destination.wiki = "<strong>Looks like Wikipedia does not know about this place! Oops!</strong>";
                        }
                    }
                }
                else {
                    $scope.origin.wiki = "<strong>Looks like Wikipedia does not know about this place! Oops!</strong>";
                }

            });

            Wiki.query({title : $scope.destination.name}).$promise.then(function (r) {
                if (r && r.query && r.query.pages) {
                    if (Object.keys(r.query.pages)[0] == -1) {
                        $scope.origin.wiki = "<strong>Looks like Wikipedia does not know about this place! Oops!</strong>";
                    }
                    else {
                        var temp = r.query.pages[Object.keys(r.query.pages)[0]];
                        if (temp && temp.extract) {
                            $scope.destination.wiki = $sanitize(temp.extract);
                        }
                        else {
                            $scope.destination.wiki = "<strong>Looks like Wikipedia does not know about this place! Oops!</strong>";
                        }
                    }
                }
                else {
                    $scope.destination.wiki = "<strong>Looks like Wikipedia does not know about this place! Oops!</strong>";
                }
            });

            Weather.query({lat : $scope.origin.lat, lon : $scope.origin.lng}).$promise.then(function (w) {
                $scope.origin.weather = w;
            });

            Weather.query({lat : $scope.destination.lat, lon : $scope.destination.lng}).$promise.then(function (w) {
                $scope.destination.weather = w;
            });
        };

        if (($scope.origin.name && $scope.destination.name)) {
            $scope.init();
        }
    }])
    .controller('transportCtrl', ['$scope', function ($scope) {
        $scope.selectRoute = function ($index) {
            $scope.transportData.selectedRouteIndex = $index;
            $scope.transportData.selectedSegmentIndex = -1;
        };

        $scope.selectSegment = function ($index) {
            $scope.transportData.selectedSegmentIndex = $index;
        };
    }])
    .controller('mapCtrl', ['$scope', '$q', function ($scope, $q) {
        $scope.mapData = {
            mapId : "map-canvas",
            mapOptions : {
                zoom : 5,
                center : new google.maps.LatLng(28.6, 77.2),
                mapTypeId : google.maps.MapTypeId.ROADMAP,
                styles : [
                    {"featureType" : "water", "stylers" : [
                        {"color" : "#19a0d8"}
                    ]},
                    {"featureType" : "administrative", "elementType" : "labels.text.stroke", "stylers" : [
                        {"color" : "#ffffff"},
                        {"weight" : 6}
                    ]},
                    {"featureType" : "administrative", "elementType" : "labels.text.fill", "stylers" : [
                        {"color" : "#e85113"}
                    ]},
                    {"featureType" : "road.highway", "elementType" : "geometry.stroke", "stylers" : [
                        {"color" : "#efe9e4"},
                        {"lightness" : -40}
                    ]},
                    {"featureType" : "road.arterial", "elementType" : "geometry.stroke", "stylers" : [
                        {"color" : "#efe9e4"},
                        {"lightness" : -20}
                    ]},
                    {"featureType" : "road", "elementType" : "labels.text.stroke", "stylers" : [
                        {"lightness" : 100}
                    ]},
                    {"featureType" : "road", "elementType" : "labels.text.fill", "stylers" : [
                        {"lightness" : -100}
                    ]},
                    {"featureType" : "road.highway", "elementType" : "labels.icon"},
                    {"featureType" : "landscape", "elementType" : "labels", "stylers" : [
                        {"visibility" : "off"}
                    ]},
                    {"featureType" : "landscape", "stylers" : [
                        {"lightness" : 20},
                        {"color" : "#efe9e4"}
                    ]},
                    {"featureType" : "landscape.man_made", "stylers" : [
                        {"visibility" : "off"}
                    ]},
                    {"featureType" : "water", "elementType" : "labels.text.stroke", "stylers" : [
                        {"lightness" : 100}
                    ]},
                    {"featureType" : "water", "elementType" : "labels.text.fill", "stylers" : [
                        {"lightness" : -100}
                    ]},
                    {"featureType" : "poi", "elementType" : "labels.text.fill", "stylers" : [
                        {"hue" : "#11ff00"}
                    ]},
                    {"featureType" : "poi", "elementType" : "labels.text.stroke", "stylers" : [
                        {"lightness" : 100}
                    ]},
                    {"featureType" : "poi", "elementType" : "labels.icon", "stylers" : [
                        {"hue" : "#4cff00"},
                        {"saturation" : 58}
                    ]},
                    {"featureType" : "poi", "elementType" : "geometry", "stylers" : [
                        {"visibility" : "on"},
                        {"color" : "#f0e4d3"}
                    ]},
                    {"featureType" : "road.highway", "elementType" : "geometry.fill", "stylers" : [
                        {"color" : "#efe9e4"},
                        {"lightness" : -25}
                    ]},
                    {"featureType" : "road.arterial", "elementType" : "geometry.fill", "stylers" : [
                        {"color" : "#efe9e4"},
                        {"lightness" : -10}
                    ]},
                    {"featureType" : "poi", "elementType" : "labels", "stylers" : [
                        {"visibility" : "simplified"}
                    ]}
                ]
            },
            mapPolylineOptions : {
                strokeOpacity : 1.0,
                strokeWeight : 4
            },
            mapMarkers : [],
            mapPolylines : []
        };

        $("#map-canvas").height(window.innerHeight * 0.8);

        $scope.mapData.mapInstance = new google.maps.Map(document.getElementById($scope.mapData.mapId), $scope.mapData.mapOptions);

        $scope.updateMap = function (routeIndx) {
            var selectedRoute = $scope.transportData.routes[routeIndx];
            if (selectedRoute) {
                var stops = selectedRoute.stops;
                var segments = selectedRoute.segments;

                //Remove all the previous markers
                $scope.setAllMap($scope.mapData.mapMarkers, null);
                $scope.mapData.mapMarkers = [];

                $scope.addMarkers(stops, true);

                //Remove all the previous polylines
                $scope.setAllMap($scope.mapData.mapPolylines, null);
                $scope.mapData.mapPolylines = [];
                $scope.addPolylines(segments);
            }
        };

        $scope.updateMapBounds = function () {
            var boundsObj = new google.maps.LatLngBounds();
            if ($scope.transportData.selectedSegmentIndex == -1) {
                var stopsArr = $scope.transportData.routes[$scope.transportData.selectedRouteIndex].stops;
                angular.forEach(stopsArr, function (val, key) {
                    boundsObj.extend(new google.maps.LatLng(val.pos.split(",")[0], val.pos.split(",")[1]));
                });
            }
            else {
                var seg = $scope.transportData.routes[$scope.transportData.selectedRouteIndex].segments[$scope.transportData.selectedSegmentIndex];
                if (seg && seg.polylineRef) {
                    var points = seg.polylineRef.getPath().getArray();
                    for (var n = 0; n < points.length; n++) {
                        boundsObj.extend(points[n]);
                    }
                }
            }
            $scope.mapData.mapInstance.fitBounds(boundsObj);
        };

        $scope.addMarkers = function (stopsArr, updateBounds) {
            var boundsObj = null;
            if (updateBounds) {
                boundsObj = new google.maps.LatLngBounds();
            }

            var markerColor = $scope.transportData.routes[$scope.transportData.selectedRouteIndex].routeColor.substr(1);
            var markerImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + markerColor,
                new google.maps.Size(21, 34),
                new google.maps.Point(0, 0),
                new google.maps.Point(10, 34));
            var markerShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
                new google.maps.Size(40, 37),
                new google.maps.Point(0, 0),
                new google.maps.Point(12, 35));

            angular.forEach(stopsArr, function (val, key) {
                var marker = new google.maps.Marker({
                    icon : markerImage,
                    shadow : markerShadow,
                    position : new google.maps.LatLng(val.pos.split(",")[0], val.pos.split(",")[1]),
                    map : $scope.mapData.mapInstance
                });
                $scope.mapData.mapMarkers.push(marker);
                if (boundsObj) {
                    boundsObj.extend(marker.position);
                }
            });
            if (updateBounds) {
                $scope.mapData.mapInstance.fitBounds(boundsObj);
            }
        };

        $scope.addPolylines = function (segArr) {
            angular.forEach(segArr, function (val, key) {
                var polyline = new google.maps.Polyline($scope.getPolyLineOptions(val.decodedPath));
                $scope.mapData.mapPolylines.push(polyline);
                polyline.setMap($scope.mapData.mapInstance);
                segArr[key].polylineRef = polyline;
            })
        };

        $scope.setAllMap = function (elemArr, mapInstance) {
            for (var i = 0; i < elemArr.length; i++) {
                elemArr[i].setMap(mapInstance);
            }
        };

        $scope.getPolyLineOptions = function (decodedPath) {
            return angular.extend(
                {
                    strokeColor : $scope.transportData.routes[$scope.transportData.selectedRouteIndex].routeColor,
                    path : decodedPath
                },
                $scope.mapData.mapPolylineOptions
            );
        };

        $scope.$watch('transportData.selectedRouteIndex', function (indx) {
            if ($scope.trnsprtQryResolved) $scope.updateMap(indx);
        });

        $scope.$watch('transportData.selectedSegmentIndex', function () {
            if ($scope.trnsprtQryResolved) $scope.updateMapBounds();
        });

    }]);

