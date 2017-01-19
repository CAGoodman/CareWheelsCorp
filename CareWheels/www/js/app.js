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
--*/

angular.module('careWheels', [
  'ionic',
  'ui.router',
  'ngCordova',
  'FredrikSandell.worker-pool',
  'angularMoment',
  'careWheels.fileloggermodule',
  'app.constants'
])


//contant definition for endpoint base url

.run(function ($rootScope, $ionicPlatform, $ionicHistory, $state, $window, User) {

  $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
    console.log('state change');

    //
    // When ever there is a state change which  means we in and out of GroupStatus then
    // we come here. We need reset the timer which flashes the red alert. Or else the
    // timer value goes on accumalating.
    //

    if ($rootScope.redAlertIndex !== undefined) {
      clearInterval($rootScope.redAlertIndex);
      $rootScope.redAlertIndex = undefined;
    }

    if (User.credentials() === null) {
      if (next.name !== 'login') {
        event.preventDefault();
        $state.go('login');
      }
    }
  });


  $ionicPlatform.registerBackButtonAction(function (event) {
    console.log("in registerbackbutton");
    console.log($ionicHistory.backTitle());
    $state.go($ionicHistory.backTitle());
  }, 100);

  $ionicPlatform.ready(function () {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

})

// API factory for making all php endpoints globally accessible.
.factory('API', function (careBankURL8443, careBankURL8080) {
  var api = {
    userAndGroupInfo: careBankURL8443 + '/userandgroupmemberinfo.php',
    userInfo: careBankURL8443 + '/userinfo.php',
    updateUserReminders: careBankURL8443 + '/updateuserreminders.php',
    groupMemberInfo: careBankURL8443 + '/groupmemberinfo.php',
    updateLastOwnership: careBankURL8443 + '/updatelastownershiptakentime.php',
    creditUser: careBankURL8443 + '/credituser.php',
    updateSettings:careBankURL8443 + '/updatesettings.php',
    refreshScreen:careBankURL8443 + '/refreshScreen.php',
    sensorDownLoad:careBankURL8443 + '/analysis.php',
    loggingServices:careBankURL8080 + '/logupload.php'
  };
  return api;
});
