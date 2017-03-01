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
.controller('AdvancedController', function ($rootScope, $scope, $state, $interval,
            $ionicPopup, Download, User, traceControls, fileloggerService) {

  $scope.traceLevel = 0;

  $scope.ScreenRefresh = function () {
    User.waitForDataDownload();  // Blocking the user till the data download is done
    Download.DownloadData(function () {
      User.completedDataDownload();       // DataDownload completed
      fileloggerService.execTrace("ScreenRefresh: Forced Screen Refresh finished");
      $state.go($rootScope.previousState, {}, {reload:true});
    });
  }

  //
  // This clears the creds, stops the download scheduler and logsout the app
  //

  $scope.Logout = function () {
    $interval.cancel(User.stopDownloadPromise);
    fileloggerService.execTrace("Logout: Logged out");
    $state.go('login', {}, {reload:true});
  }

  $scope.ClearMemory = function () {
    window.applicationCache.abort();
    window.caches.delete(100);
    window.localStorage.clear();
    fileloggerService.execTrace("ClearMemory: Local memory cleared");
    $ionicPopup.alert({
       title: "Data and cache memory cleared!!",
       subTitle: ""
    });
    $state.go($rootScope.previousState, {}, {reload:true});
  }

  //
  // Logfile is created and updated continuously as the app runs. Daily at the end of the day 00:00Hrs
  // the log file is cleared and new one generated to keep the size small and manageable. When there is
  // an issue all the user needs to do is send it off to the server. The file is located in
  // localStorage://localhost/careWheelsLocalLogFile.log
  //

  $scope.UploadLogfile= function (traceLevel) {
    var creds = User.credentials();
    fileloggerService.logUpload(creds.username, creds.password);
    fileloggerService.execTrace("UploadLogfile: Logfile uploaded to the server");
    $ionicPopup.alert({
      title: "Logfile has been uploaded to the CareWheels server!!",
      subTitle: "A friendly customer service professional will get back to you soon"
    });
  }
})