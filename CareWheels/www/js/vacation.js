//
// CareWheels Corporation 2016
// Filename: vacation.js
// Description: Vacation controller enables and disasbles vacation mode
//
// Authors: Capstone students PSU Aug 2016
// Revision: Data download has to happen for the user to become unclickable or clickable - AV 02/04/2017
//           Cleanup and fix vacation related issue - NXB 02/07/2017
//


angular.module('careWheels')

.controller('vacationController',
	function($scope, $state, $controller, $ionicLoading, GroupInfo, User, Download, fileloggerService) {

	//
	// From menu.html the control comes here and the pbject $scope.data.currentVacationMode gets initialized
	// $scope makes it possible for this value to be visible in the vacation.html too
	//

    $scope.data = {'currentVacationMode' :User.getVacationValue()};

    //
    // After the above line execution the control goes back to menu.html and the Vaction Mode button is visible. When the user
    // clicks it and toggles the switch $scope.data.currentVacationMode value also toggles. Then control comes dow to
    // $scope.toggleVacationMode() and things happen. Important thing is $scope sees both side the binding varaible
    // between the HTML and JS
    //


    $scope.toggleVacationMode = function (currentVacationMode) {
    	fileloggerService.info("VacationCtrl:toggleVacationMode: Enter");
		var creds = User.credentials();
		User.setOnVacation(creds.username, creds.password, $scope.data.currentVacationMode).then(function(resultValue){
			User.waitForDataDownload();  // Blocking the user till the data download is done
	        Download.DownloadData(function(){
	        	User.completedDataDownload();       // DataDownload completed
	            $state.go('app.groupStatus');     // go to group view
	        });
    	});
    	fileloggerService.info("VacationCtrl:toggleVacationMode: Exit");
	}
});