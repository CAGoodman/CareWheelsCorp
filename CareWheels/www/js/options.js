// 
// CareWheels Corporation 2016
// Filename: options.js
// Description: This introduces new menu item like logout, Screen Refresh, debug
//
// Authors: Ananda Vardhana 11/28/16
// Revision: 
//
//

angular.module('careWheels')

.controller('optionsController', function($scope, $controller, GroupInfo, User, Download) {
	
	$scope.ScreenRefresh = function ()
	{
		Download.DownloadData(function(){
            console.log('Forced Screen Refresh finished')
          });
	};
});
