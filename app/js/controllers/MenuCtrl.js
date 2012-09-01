'use strict';
function MenuCtrl($scope, pubSub, dataBridge, versionManager, host, activeRightPane, server) {
	$scope.versions = [];
	$scope.versionManager = versionManager;
    pubSub.sub('Server.history', function (data) {
        console.log(data);
        $scope.versions = data;
        $scope.$apply();
    });

    pubSub.sub('Server.newHistoryItem', function(data) {
        $scope.versions.unshift(data);
        $scope.$apply();
    });
    
    pubSub.sub('Server.templates', function (data) {
        $scope.templates = data;
        $scope.$apply();
    });
	
    pubSub.sub('Server.readOnly', function (readOnly) {
    	$scope.readOnly = readOnly;
	    console.log("isReadOnly: " + $scope.readOnly);
    	$scope.$apply();
    });

    if (versionManager.getId()) {
        getStateFromServer(versionManager.getId(), versionManager.getVersion());
    }
    getTemplatesFromServer();

    $scope.loadTemplate = function (name) {
    	for (var template in $scope.templates) {
    		var t = $scope.templates[template];
    		if (t.name == name) {
    			getStateFromServer(t.id, t.version);
				versionManager.set(t.id, t.version);
        		//pubSub.pub('Server.code', $scope.templates[template].code);
                break;
            }
        }
    };

    $scope.saveToServer = function () {
	    server.save();
    };

	$scope.fork = function() {
		server.fork();
	};
	
	$scope.publish = function () {
		server.publish();
	};
	
	pubSub.sub('Server.Publish', function (id) {
		window.open('embed.html?id=' + id + '&version=0', '_newtab');
	});

    $scope.loadVersion = function (version) {
        getStateFromServer(versionManager.getId(), version);
    };

    function getStateFromServer(id, version) {
        $.ajax({
            url: host + "/api/craft/" + id + "/code/" + version,
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
    }
    
    function getTemplatesFromServer() {
        $.ajax({
            url: host + "/api/templates",
            success: function (data) {
                    if (data.templates) {
                        pubSub.pub('Server.templates', data.templates);
                    }
            },
            dataType: 'json'
        });
    }

	activeRightPane.set('game');
	$scope.activeButtonClass = function(btn) {
		if (activeRightPane.is(btn)) {
			return 'active';
		} else {
			return '';
		}
	};
	$scope.rightPane = function(btn) {
		activeRightPane.set(btn);
	};
	$scope.readOnlyClass = function (displayIfReadOnly) {
		console.log($scope.readOnly);

		if (displayIfReadOnly && $scope.readOnly) {
			return "";
		}
		if (!displayIfReadOnly && !$scope.readOnly) {
			return "";
		}
		return "hidden";
	};
}