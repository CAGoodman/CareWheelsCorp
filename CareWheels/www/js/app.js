/* eslint-env angular */
/*++
 CareWheels Corporation 2016
 Filename: app.js
 Description: The basic API's are initialized here so that all of them have a direct access to CareBank server

 Authors: Capstone students PSU Aug 2016
 Revision: Changed the URL to point to a particular IP for devlopement - AV 10/27/16


 Ionic Starter App
 angular.module is a global place for creating, registering and retrieving Angular modules
 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
 the 2nd parameter is an array of 'requires'
 Before the login screen all the services excpeting paymentServices gets called including app.js
--*/

angular.module('careWheels', [
  'ionic',
  'ui.router',
  'ngCordova',
  'angularMoment',
  'careWheels.fileloggermodule',
  'ng.constants',
  'app.constants'
])


.run(function ($rootScope, $interval, $ionicPlatform, $ionicHistory, $ionicPopup, $state, User, loginDependencies, fileloggerService) {

  //
  // preLogin.log will save away the console.log messages we miss out in the main log file careWheelsLocalLogFile.log.
  //

  window.localStorage.removeItem('preLogin.log');
  window.localStorage['preLogin.log'] = "\n******Pre Login Log Messages Begin****** \n\n";
  $rootScope.fileUploaded = false;   // This will ensure the preLogin messages gets stored in preLogin.log
  fileloggerService.info("App: Main App Entered");

  var statePaused = false;     // This is the actual state when it goes to pause mode. Pushing app to BG does not put the app in Pause mode
  var pauseData = undefined;
  var curState = undefined;

  //
  // When ionic.serve is run this is the entry point to the application
  //

  $rootScope.autoRefresh = false;

  document.addEventListener("pause", function() {
    statePaused = true;       // Now this has really entered to pause mode
    window.localStorage["background"] = angular.toJson({"curState": curState, "loginstate": $rootScope.loginstate, "loggedIn": $rootScope.loggedIn, "statePaused": statePaused});
    pauseData = angular.fromJson(window.localStorage["background"])
    fileloggerService.info("App: App Paused: " + JSON.stringify(pauseData));
  }, false);

  document.addEventListener("resume", function() {
    window.localStorage.removeItem("background");
    fileloggerService.info("App: App Resumed from Background: " + JSON.stringify(pauseData));
  }, false);

  //
  // When the app goes to background or when the screen locker kicks in user manually pushes the app to background
  // it is just out of sight only, it is in "paused" state. It will be running as usual and you can bring it
  // forward which is called -"resume". This can keep happening and this will not affect the app working.
  // However when more and more apps gets pushed to background at some point the app will have relinquish its memory
  // at that point the app gets logged out. So when the user pulls it foreground the app will not be at the screen
  // where the user left it. It will be at login screen. With the following fix the user will be at GS screen
  // Scenario1: It can go to BG when it is in login screen. Then when it is pulled to FG we should just display login prompt
  // Scenario2: It can go to BG from any other controller states but on resume it has to return to GS becasue the
  // whole structure of the code is centralized around GS
  //
  //

  pauseData = angular.fromJson(window.localStorage["background"]) ;  // We have resumed so read the saved state
  window.localStorage.removeItem("background");
  if (pauseData != undefined && pauseData.statePaused) {  // If it had not been paused then we just skip
    if ($rootScope.loggedIn == undefined) {   // It could have paused while sitting at login screen then just ignore
      if (!pauseData.loginstate) {   // It went from loginState to some other controller state
        var credentials = angular.fromJson(window.localStorage['loginCredentials']);
        if (credentials) {
          fileloggerService.info("App: App Resumed from Reset: " + JSON.stringify(pauseData));
          $rootScope.resumeInitiatedLogin = true;
          $state.go('login', {}, {reload:true});  // We go to login.js and then boot up to GS
        }
      }
    }
  }

  $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {

    fileloggerService.info("App: StateChangeStart: State change Start " + "From: " + fromState.name + " Next:" + next.name);
    curState = next.name;

    //
    // When ever there is a state change which  means we go in and out of GroupStatus then
    // we come here. We need to reset the timer which flashes the red alert. Or else the
    // timer occurrence goes on accumalating.
    //

    if ($rootScope.redAlertPromise !== undefined) {
      $interval.cancel($rootScope.redAlertPromise);
      $rootScope.redAlertPromise = undefined;
    }

    if (User.credentials() === null) {
      if (next.name !== 'login') {
        event.preventDefault();
        $state.go('login');
      }
    }
  }); //$rootScope.$on()


  //
  // The following code gets executed on all page change and previous and current state is
  // remembered, it becomes easier to switch back from any page to the previous page. for example you can run
  // $state.go($rootScope.previousState, {}, {reload:true}); on any page to go back to the previous page.
  //

  $rootScope.$on('$stateChangeSuccess', function(event, next, toParams, from, fromState) {
      $rootScope.previousState = from.name;
      $rootScope.currentState = next.name;
      fileloggerService.info("App: StateChangeSuccess: State change Success " + "From: " + fromState.name + " Next: " + next.name);

  });

  $ionicPlatform.registerBackButtonAction(function (event) {
    fileloggerService.info("In Back button handler" + $ionicHistory.backTitle());
    $state.go($ionicHistory.backTitle());
  }, loginDependencies.backbuttonTimeout);

  $ionicPlatform.ready(function () {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

  //
  // Anywhere in the code if there is an error and we want to bail out all we
  // have to do is broadcast('Logout'). This on will pick it up and safely log you out.
  // Right now the event and args are place holders but will be used for debug trace
  //

  $rootScope.$on('Logout', function(event, args) {
    fileloggerService.info("App: Logout broadcast caught", args);   // args contains the name of the function calling logout.
    $interval.cancel($rootScope.stopDownloadPromise);
    $rootScope.stopDownloadPromise = undefined;
    $state.go('login', {}, {reload:true});
  });

  fileloggerService.info("App: Main App Exited");

})

// API factory for making all php endpoints globally accessible.
.factory('API', function (cbUrls) {
  var api = {
    userAndGroupInfo: cbUrls.careBankURL8443 + '/userandgroupmemberinfo.php',
    updateUserReminders: cbUrls.careBankURL8443 + '/updateuserreminders.php',
    // userInfo: cbUrls.careBankURL8443 + '/userinfo.php',
    //groupMemberInfo: cbUrls.careBankURL8443 + '/groupmemberinfo.php',
    creditUser: cbUrls.careBankURL8443 + '/credituser.php',
    updateSettings:cbUrls.careBankURL8443 + '/updatesettings.php',
    sensorDownLoad:cbUrls.careBankURL8443 + '/analysis.php',
    loggingServices8080:cbUrls.careBankURL8080 + '/logupload.php',
    loggingServices8443:cbUrls.careBankURL8443 + '/logupload.php'
  };
  return api;
});