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
.controller('AdvancedController', function ($rootScope, $scope, $state, $interval, $ionicLoading,
            $ionicPopup, Download, User, traceControls) {

  $scope.traceLevel = 0;

  $scope.ScreenRefresh = function () {
    User.waitForDataDownload();  // Blocking the user till the data download is done
    Download.DownloadData(function () {
      User.completedDataDownload();       // DataDownload completed
      console.log('Forced Screen Refresh finished');
      $state.go($rootScope.previousState, {}, {reload:true});
    });
  }

  //
  // This clears the creds, stops the download scheduler and logsout the app
  //

  $scope.Logout = function () {
    $interval.cancel(User.stopDownloadPromise);
    $state.go('login', {}, {reload:true});
  }

  $scope.ClearMemory = function () {
    window.applicationCache.abort();
    window.caches.delete(100);
    window.localStorage.clear();
    $ionicPopup.alert({
       title: "Data and cache memory cleared!!",
       subTitle: ""
    });
    $state.go($rootScope.previousState, {}, {reload:true});
  }

  //
  // When there are issues the user will enable debug. Debug enabled is remembered and on restart
  // will produce detailed error log.
  // In case the app does not even display the login screen and dies during login then we have to
  // ask the user to uninstall the APK and we need to provide debug version of the APK in
  // which the traceLevel is set to "error"
  //

  $scope.EnableDebug = function (traceLevel) {
    traceLevel = "1";                             // For now we have only one level - 1.
    window.localStorage['execTraceLevel'] = angular.toJson({"traceFilter": traceLevel});
    $ionicPopup.alert({
      title: "Debug Enabled. Logout/login to capture debug log!!",
      subTitle: "After the debug run logout/login once more to disable debug"
    });
  }
})