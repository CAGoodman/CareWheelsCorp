//
// CareWheels Corporation 2016
// Filename: vacation.js
// Description: Vacation controller enables and disasbles vacation mode
//
// Authors: Capstone students PSU Aug 2016
// Revision: Data download has to happen for the user to become unclickable or clickable - AV 02/04/2017
//
//


angular.module('careWheels')

.controller('vacationController',
	function($scope, $state, $controller, $ionicLoading, GroupInfo, User, Download) {

    $scope.value = User.getVacationValue();

    $scope.toggleVacationMode = function () {

		var creds = User.credentials();
		var newValue;

		if ($scope.value == false) {
			newValue = 'True';
		} else {
			newValue = 'False';
		}

		// console.log('testToggle changed to ' + $scope.value);

		User.setOnVacation(creds.username, creds.password, newValue).then(function(resultValue){

			if(resultValue) {
				if ($scope.value == false) {
					$scope.value = true;
				} else {
					$scope.value = false;
				}
				User.setVacationValue($scope.value);
		    	User.waitForDataDownload();  // Blocking the user till the data download is done
		        Download.DownloadData(function(){
		        	$ionicLoading.hide();               // kill the data download screen
		            $scope.$broadcast('scroll.refreshComplete');
		            console.log('Pull down refresh done!');
		            $state.go('app.groupStatus');     // go to group view
		        });
			} else {
			  $scope.value.Selected=$scope.value;
			}
		});
    };
});
