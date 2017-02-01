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
.controller('AdvancedController', function ($scope, $state, $interval, Download, User) {

  $scope.ScreenRefresh = function () {
    Download.DownloadData(function () {
      console.log('Forced Screen Refresh finished')
    })
  }

  //
  // This clears the creds, stops the download scheduler and logsout the app
  //

  $scope.Logout = function () {
    $interval.cancel(User.stopDownloadPromise);
    $state.go('login', {}, {reload:true});
  }
})