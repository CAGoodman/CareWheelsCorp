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
            $ionicPopup, Download, User, fileloggerService) {

  fileloggerService.info("AdvCtrl: Advance Controller Entered");

/* BACKGROUND Hooks
  $rootScope.$on('onPaused', function(event, args) {
    console.log("adv: root - OnPause got it!!");
  });

  $scope.$on('onPaused', function(event, args) {
    console.log("adv: OnPause got it!!");
  });

  $rootScope.$on('onResumed', function(event, args) {
    console.log("adv: root - onResume got it!!");
  });

  $scope.$on('onResumed', function(event, args) {
    console.log("adv: onResume got it!!");
  });
*/

  $scope.ScreenRefresh = function () {
    User.waitForDataDownload("Screen refresh under progress: ");  // Blocking the user till the data download is done
    Download.DownloadData(function () {
      User.completedDataDownload();       // DataDownload completed
      //fileloggerService.info("AdvCtrl:ScreenRefresh: Exit");
      fileloggerService.info("AdvCtrl: ScreenRefresh: Successfully refreshed screen");
      $state.go($rootScope.previousState, {}, {reload:true});
    });
  }

  $scope.InitiateLogout = function () {
    fileloggerService.info("AdvCtrl: InitiateLogout: Successfully logged out");
    $rootScope.$emit('Logout', "Advance InitiateLogout");
  }

  $scope.ClearMemory = function () {
    //fileloggerService.info("AdvCtrl:ClearMemory: Enter");
    window.applicationCache.abort();
    window.caches.delete(100);
    window.localStorage.clear();
    //fileloggerService.info("AdvCtrl:ClearMemory: Exit");
    $ionicPopup.alert({
       title: "Data and cache memory cleared!!",
       subTitle: ""
    });
    fileloggerService.info("AdvCtrl: ClearMemory: Successfully cleared memory");
    $state.go($rootScope.previousState, {}, {reload:true});
  }

  //
  // Logfile is created and updated continuously as the app runs. Daily at the end of the day 00:00Hrs
  // the log file is cleared and new one generated to keep the size small and manageable. When there is
  // an issue all the user needs to do is send it off to the server. The file is located in
  // localStorage://localhost/careWheelsLocalLogFile.log
  //

  $scope.UploadLogfile= function () {
    var creds = User.credentials();
    $rootScope.fileUploaded = false;   // This will ensure the preLogin messages gets storedin preLogin.log
    //fileloggerService.info("AdvCtrl:UploadLogfile: Enter");
    fileloggerService.logUpload(creds.username, creds.password, "UploadLogfile");
    $ionicPopup.alert({
      title: "Logfile has been uploaded to the CareWheels server!!",
      subTitle: "A friendly customer service professional will get back to you soon"
    });
    //fileloggerService.info("AdvCtrl:UploadLogfile: Exit");
  }

  //
  // Logfiles can grow to horrendous so once in a while it is better to delete it.
  // During debug, validation and testing it is helpful to have a small logfile to manage.
  //

   $scope.DeleteLogfile= function () {
    //fileloggerService.info("AdvCtrl:DeleteLogfile: Enter");
    fileloggerService.deleteLogFile();
    //fileloggerService.info("AdvCtrl:DeleteLogfile: Exit");
    $ionicPopup.alert({
      title: "Logfile has been deleted",
      subTitle: "A new logfile automatically starts building up which you can upload anytime"
    });
    fileloggerService.info("AdvCtrl: DeleteLogfile: Successfully deleted logfile");
  }

  //
  // 1. When there are issues the user will enable debug. Debug enabled is remembered and on restart
  // will produce detailed error log.
  // 2. For demonstations we need to instrument the code this feature will enable that too.
  // In case the app does not even display the login screen and dies during login then we have to
  // ask the user to uninstall the released version of the APK and install a debug version of the APK
  //

  $scope.EnableDebug = function (dbgLevel) {
    //fileloggerService.info("AdvCtrl:EnableDebug: Enter");
    switch(dbgLevel) {
      case "0":
      case "1":
      case "2":
      case "3":
        break;
      default:
        $ionicPopup.alert({
          title: "Debug was not Enbaled, Currently supported level are 0 - Disable, 1 - DemoEnable, 2 - PullEnable, 3 - NA",
          subTitle: "Please select a number below the Debug Enable button"
        });
        return;
    }
    $rootScope.dbgLevel = dbgLevel;
    if (dbgLevel != 0) {
      $ionicPopup.alert({
        title: "Debug Enabled. Set to level: " + dbgLevel,
        subTitle: "Do a Screen Refresh. After the debug run set it back to 0"
      });
    } else {
      $ionicPopup.alert({
        title: "Debug Disabled. Set to level: 0",
        subTitle: "Do a Screen Refresh to restore default data"
      });
    }
    //fileloggerService.info("AdvCtrl:EnableDebug: Exit");
  }
  fileloggerService.info("AdvCtrl: Advance Controller Exited");
})