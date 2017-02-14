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
  // When there are issues the user will enable debug and select a suitable level and reboot.
  // The selected level is remembered and on the reboot will produce detaile error log.
  // In case the app does not even display the login screen and dies during login then we have to
  // ask the user to uninstall the APK and we need to provide debug version of the APK in
  // which the traceLevel is set to "error"
  //

  $scope.EnableDebug = function (traceLevel) {
    // execTraceLevel is the key, traceFilter is the tag and tracelevel is the value

    var traceLevel = prompt("Please enter Execution Trace Level 0 - Info, 1 - Verbose, 2 - Warnings, 3 - Errors", 0);

    switch(traceLevel){
      case "1":
      case "2":
      case "3":
        window.localStorage['execTraceLevel'] = angular.toJson({"traceFilter": traceLevel});
        $ionicPopup.alert({
          title: "Execution trace log Enabled!!",
          subTitle: ""
        });
        break;
      default:          // The user has hit cancel or did not change and just hit ok or typed garbage so just ignore
        $ionicPopup.alert({
          title: "Execution trace log was NOT Enabled!!",
          subTitle: "Valid inputs are 1, 2 or 3. Please try again"
        });
    }
  }
})