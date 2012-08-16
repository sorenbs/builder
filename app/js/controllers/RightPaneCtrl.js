'use strict';

function RightPaneCtrl($scope, activeRightPane) {
	$scope.displayInRightPane = function (pane) {
		if (activeRightPane.is(pane)) {
			return '';
		} else {
			return 'hidden';
		}
	};
}