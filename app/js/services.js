'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var builderServices = angular.module('builder.services', []);

builderServices.value('staticHost', 'file:///C:/crafty/builder/app/'); //'http://www.craftybuilder.com');
builderServices.value('dynamicHost', 'http://www.craftybuilder.com:8080');// 'http://127.0.0.1:8080');
builderServices.value('imageHost', 'http://www.craftybuilder.com');

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
            if (providers[name]) {
                console.log("Warning: provider already defined and will be overridden. " + name);
            }
            providers[name] = providerFunc;
        },
        retrieve: function (name) {
            if (!providers[name]) {
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
            if (!id) {
                id = 0;
            }
            return id;
        },

        set: function (id, version) {
            console.log(id + ' ' + version);
            $location.search({ version: version, id: id });
            if (!$rootScope.$$phase) $rootScope.$digest();
        }
    };
});

builderServices.factory('activeRightPane', function($location, $rootScope) {
    return {
        activePane: '',
        set: function(pane) {
            this.pane = pane;
        },
        get: function() {
            return activePane;
        },
        is: function(pane) {
            return this.pane === pane;
        }
    };
});

builderServices.factory('server', function ($location, $rootScope, versionManager, dataBridge, pubSub, dynamicHost, staticHost) {
    return {
        save: function(onSuccess, onError) {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: dynamicHost + "/api/craft/" + versionManager.getId() + "/code/" + versionManager.getVersion(),
                data: { code: dataBridge.retrieve('Editor.value') },
                success: function (data) {
                    if (data.error) {
                        pubSub.pub('Console.log', "Problem saving: " + data.error);
                        if (onError) {
                            onError.call();
                        }
                    } else {
                        versionManager.set(data.id, data.version);
                        pubSub.pub('Console.log', "Saved version " + data.version);
                        pubSub.pub('Server.newHistoryItem', data.newVersion);
                        if (onSuccess) {
                            onSuccess.call(this);
                        }
                    }
                }
            });
        },
        fork: function (id, version, onSuccess, onError) {
            if(!id) {
                id = versionManager.getId();
            }
            if (!version) {
                version = versionManager.getVersion();
            }
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: dynamicHost + "/api/craft/" + id + "/fork/" + version,
                data: { },
                success: function (data) {
                    if (data.error) {
                        console.log("Problem forking: " + data.error);
                        pubSub.pub('Console.log', "Please save before you fork");
                        if (onError) {
                            onError.call();
                        }
                    } else {
                        versionManager.set(data.id, data.version);
                        console.log('forkedddd');
                        console.log(data);
                        pubSub.pub('Console.log', "forked version " + data.version);
                        if (data.code) {
                            pubSub.pub('Server.code', data.code);
                        }
                        if (data.history) {
                            pubSub.pub('Server.history', data.history);
                        }
                        if (data.images) {
                            pubSub.pub('Server.images', data.images);
                        }
                        pubSub.pub('Server.readOnly', data.readOnly);
                        if (onSuccess) {
                            onSuccess.call(this);
                        }
                    }
                }
            });
        },
        publish: function (id, version, onSuccess, onError) {
            if (!id) {
                id = versionManager.getId();
            }
            if (!version) {
                version = versionManager.getVersion();
            }
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: dynamicHost + "/api/craft/" + id + "/publish/" + version,
                data: {},
                success: function (data) {
                    if (data.error) {
                        console.log("Problem publishing: " + data.error);
                        pubSub.pub('Console.log', "Please save before you publish");
                        if(onError) {
                            onError.call();
                        }
                    } else {
                        pubSub.pub('Console.log', "Published with new id " + data.id);
                        pubSub.pub('Console.log', "avaliable at " + staticHost + "/embed.html?id=" + data.id);
                        if (data.id) {
                            pubSub.pub('Server.Publish', data.id);
                        }
                        if (onSuccess) {
                            onSuccess.call(this);
                        }
                    }
                }
            });
        },
		
        getState: function(id, version) {
            if (!id) {
                id = versionManager.getId();
            }
            if (!version) {
                version = versionManager.getVersion();
            }
            $.ajax({
                url: dynamicHost + "/api/craft/" + id + "/code/" + version,
                success: function (data) {
                    if (data.error) {
                        pubSub.pub('Console.log', "AWK!, " + data.error);
                    } else {
                        if (data && data.code != "") {
                            pubSub.pub('Server.code', data.code);
                        }
                        if (data.history) {
                            pubSub.pub('Server.history', data.history);
                        }
                        if (data.images) {
                            pubSub.pub('Server.images', data.images);
                        }
                        if (data.readOnly) {
                            pubSub.pub('Server.readOnly', data.readOnly);
                        }
                    }
                },
                dataType: 'json'
            });
        },


        get: function() {
            return activePane;
        },
    is: function(pane) {
        return this.pane === pane;
    }
};
});