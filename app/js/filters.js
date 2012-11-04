'use strict';

/* Filters */

var filterModule = angular.module('builder.filters', []);

filterModule.filter('interpolate', ['version', function (version) {
    return function (text) {
        return String(text).replace(/\%VERSION\%/mg, version);
    };
}]);

filterModule.filter('humanDate', function() {
    return function(input) {
        var date = new Date(Date.parse(input));
        var dateStr = ('0' + date.getHours()).substr(-2, 2) + ':' + ('0' + date.getMinutes()).substr(-2, 2) + " " + ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"][date.getMonth()] + " " + date.getDate();
        return dateStr;
    };
});

filterModule.filter('shorten', function () {
    return function (input, length) {
        if(typeof input === "undefined") {
            return "";
        }

        if(input.length < length) {
            return input;
        }
        
        return input.substring(0, length - 3) + "...";
    };
});

filterModule.filter('imageLocation', function (imageHost) {
    return function (imageName) {
        return imageHost + imageName;
    };
});
