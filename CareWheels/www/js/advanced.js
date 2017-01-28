//
// CareWheels Corporation 2016
// Filename: advanced.js
// Description: This introduces new menu item like logout, Screen Refresh, debug
//
// Authors: Ananda Vardhana 11/28/16
// Revision:
//
//
angular.module('careWheels')
.controller('AdvancedController', function ($scope, $state, Download, User) {

  $scope.ScreenRefresh = function () {
    Download.DownloadData(function () {
      console.log('Forced Screen Refresh finished')
    })
  }

  //
  // This clears the creds and logout the app
  //

  $scope.Logout = function () {
  	User.ClearCredentials();
    $state.go('login');
  }
})