'use strict';


function AssetsCtrl($scope, pubSub, host, versionManager, server) {

	$scope.images = [];

	pubSub.sub('Server.images', function (images) {
		console.log('Server.images');
		$scope.images = images;
		$scope.$apply();
	});

	function addDroppedFiles(files) {
		for (var i = 0; i < files.length; i++) {
			if (versionManager.getId() != 0) {
				uploadFile(files[i]);
			} else {
				console.log(i);
				server.save(function(file) {
					return function() {
						uploadFile(file);
					};
				}(files[i]));
			}
		}
	}
	
	function uploadFile(file) {
		var fd = new FormData();
		fd.append(file.name, file);
		
		$.ajax({
			type: 'POST',
			url: host + "/api/craft/" + versionManager.getId() + "/image/" + versionManager.getVersion(),
			data: fd,
			contentType: false,
			processData: false,
			success: function (data) {
				if (data.error) {
					pubSub.pub('Console.log', "Problem saving: " + data.error);
				} else {
					pubSub.pub('Console.log', "Saved image " + data.name);
					$scope.images.push({ name: data.name, snippet: "Cool!" });
					$scope.$apply();
				}
			}
		});
	}

	var dropbox = document.getElementById("fileDropArea");
	dropbox.addEventListener("dragenter", function (e) {
		e.stopPropagation();
		e.preventDefault();
		dropbox.style.backgroundColor = "green";
	}, false);
	dropbox.addEventListener("dragleave", function (e) {
		console.log(e);
		e.stopPropagation();
		e.preventDefault();
		dropbox.style.backgroundColor = "gray";
	}, false);
	dropbox.addEventListener("dragover", function (e) {
		e.stopPropagation();
		e.preventDefault();
	}, false);
	dropbox.addEventListener("drop", function (e) {
		e.stopPropagation();
		e.preventDefault();
		var dt = e.dataTransfer;
		var files = dt.files;
		dropbox.style.backgroundColor = "lime";
		addDroppedFiles(files);
	}, false);
}