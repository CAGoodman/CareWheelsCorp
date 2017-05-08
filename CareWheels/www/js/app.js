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


.run(function ($rootScope, $interval, $ionicPlatform, $ionicHistory, $state, User, loginDependencies) {

  //
  // When ionic.serve is run this is the entry point to the application
  //

  $rootScope.autoRefresh = false;

  $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {

    console.log("StateChangeStart: State change Start " + "From: " + fromState.name + " Next: " + next.name);

    //
    // When ever there is a state change which  means we go in and out of GroupStatus then
    // we come here. We need to reset the timer which flashes the red alert. Or else the
    // timer occurrence goes on accumalating.
    //

    if ($rootScope.redAlertPromise !== angular.isundefined) {
      $interval.cancel($rootScope.redAlertPromise);
      $rootScope.redAlertPromise = angular.isundefined;
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
      console.log("StateChangeSuccess: State change Success " + "From: " + fromState.name + " Next: " + next.name);

  });

  $ionicPlatform.registerBackButtonAction(function (event) {
    console.log("In Back button handler" + $ionicHistory.backTitle());
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
  
  $ionicPlatform.ready(function() {
    document.addEventListener("pause", function() {
	  console.log($state.current.name);
	  if ($state.current.name != 'login') {
	    window.localStorage["autoLoginCredentials"] = angular.toJson(User.credentials());
        console.log("The application is pausing from non-login state -- Saving " + angular.toJson(User.credentials()));
	  } else {
	    window.localStorage.removeItem("autoLoginCredentials");
        console.log("The application is pausing from login state -- Removing Auto-login credentials for safety");	  
	  }
    }, false);
  });
  
   $ionicPlatform.ready(function() {
    document.addEventListener("resume", function() {
      window.localStorage.removeItem("autoLoginCredentials");
      console.log("The application is resuming -- Removing Auto-login credentials");
    }, false);
  });

})

.config(function($ionicConfigProvider) {
  // Explicitly center NavBar title to avoid crowding especially in Individual Status
  $ionicConfigProvider.navBar.alignTitle('center');
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
