'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var builderServices = angular.module('builder.services', []);

builderServices.value('version', '0.21');
builderServices.value('host', 'http://127.0.0.1:8080');

// PubSub service
builderServices.factory('pubSub', function () {
    var subscribers = {};
    return {
        pub: function (name, data) {
            if (subscribers[name]) {
                angular.forEach(subscribers[name], function (subscriber, key) {
                    subscriber.call(this, data);
                });
            }
        },
        sub: function (name, callback) {
            if (subscribers[name]) {
                subscribers[name].push(callback);
            } else {
                subscribers[name] = [callback];
            }
        }
    };
});

builderServices.factory('dataBridge', function () {
    var providers = {};
    return {
        provide: function (name, providerFunc) {
            if(providers[name]) {
                console.log("Warning: provider already defined and will be overridden. " + name);
            }
            providers[name] = providerFunc;
        },
        retrieve: function (name) {
            if(!providers[name]) {
                console.log("Warning: no provider defined. " + name);
                return null;
            }
            return providers[name].call(this);
        }
    };
});

builderServices.factory('versionManager', function ($location, $rootScope) {
    return {
        getVersion: function () {
            var version = $location.search().version;
            if (!version) {
                version = 0;
            }
            return version;
        },
        
        getId: function () {
            var id = $location.search().id;
            if(!id) {
                id = 0;
            }
            return id;
        },
        
        set: function (id, version) {
            console.log(id + ' ' + version);
            $location.search({ version: version, id: id });
            $rootScope.$apply();
        }
    };
})