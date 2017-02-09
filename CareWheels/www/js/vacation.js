//
// CareWheels Corporation 2016
// Filename: vacation.js
// Description: Vacation controller enables and disasbles vacation mode
//
// Authors: Capstone students PSU Aug 2016
// Revision: Data download has to happen for the user to become unclickable or clickable - AV 02/04/2017
//           Cleanup and fix vacation related issue - NXB 02/07/2017
//
//


angular.module('careWheels')

.controller('vacationController',
	function($scope, $state, $controller, $ionicLoading, GroupInfo, User, Download) {

    $scope.currentVacationMode = User.getVacationValue();

    $scope.toggleVacationMode = function () {

		var creds = User.credentials();

		User.setOnVacation(creds.username, creds.password, !$scope.currentVacationMode).then(function(resultValue){
			User.waitForDataDownload();  // Blocking the user till the data download is done
	        Download.DownloadData(function(){
	        	User.completedDataDownload();       // DataDownload completed
	            $state.go('app.groupStatus');     // go to group view
	        });
    	});
	}
});