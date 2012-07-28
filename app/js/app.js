'use strict';


// Declare app level module which depends on filters, and services
var builderModule = angular.module('builder', ['builder.filters', 'builder.services', 'builder.directives']);

builderModule.config(function($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
});


