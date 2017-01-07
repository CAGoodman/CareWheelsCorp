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
.constant('BASE_URL', 'https://CareBank.CareWheels.org:8443')

.run(function ($rootScope, $ionicPlatform, $ionicHistory, $state, $window, User) {

  $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
    console.log('state change');

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
.factory('API', function (BASE_URL) {
  var api = {
    userAndGroupInfo: BASE_URL + '/userandgroupmemberinfo.php',
    userInfo: BASE_URL + '/userinfo.php',
    updateUserReminders: BASE_URL + '/updateuserreminders.php',
    groupMemberInfo: BASE_URL + '/groupmemberinfo.php',
    updateLastOwnership: BASE_URL + '/updatelastownershiptakentime.php',
    creditUser: BASE_URL + '/credituser.php',
    updateSettings:BASE_URL + '/updatesettings.php',
    refreshScreen:BASE_URL + '/refreshScreen.php'
  };
  return api;
});
