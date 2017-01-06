/*++
 CareWheels Corporation 2016
 Filename: routes.js
 Description: This routes the Clickable menu to a new HTML page

 Authors: Capstone students PSU Aug 2016
 Revision: Added Options menu item  - AV 11/28/2016

--*/
angular.module('careWheels')

  .config(function ($stateProvider, $urlRouterProvider) {

    //$urlRouterProvider.otherwise('/');
    $stateProvider

      .state('login', {
        url: '/login',
        templateUrl: 'views/login.html',
        controller: 'loginController'
      })

      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'views/menu.html',
        controller: 'menu'
      })

      .state('app.groupStatus', {
        cache: false,
        url: '/groupStatus',
        views: {
          'menuContent': {
            templateUrl: 'views/groupStatus.html',
            controller: 'groupStatusController'
          }
        }
      })

      .state('app.individualStatus', {
        cache: false,
        url: '/individualStatus',
        views: {
          'menuContent': {
            templateUrl: 'views/individualStatus.html',
            controller: 'individualStatusController'
          }
        }
      })
      .state('app.reminders', {
        url: '/reminders',
        views: {
          'menuContent': {
            templateUrl: 'views/reminders.html',
            controller: 'remindersController'
          }
        }
      })
      .state('app.settings', {
        url: '/settings',
        views: {
          'menuContent': {
            templateUrl: 'views/settings.html',
            controller: 'settingsController'
          }
        }
      })
      .state('app.options', {							// ABCMods for adding a new menu item options
        url: '/options',
        views: {
          'menuContent': {
            templateUrl: 'views/options.html',
            controller: 'OptionsController'
          }
        }
      });
      $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("app.groupStatus");
      });
  });
