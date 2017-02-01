/*++
 CareWheels Corporation 2016
 Filename: routes.js
 Description: This routes the Clickable menu to a new HTML page

 Authors: Capstone students PSU Aug 2016
 Revision: Added Advanced menu item  - AV 11/28/2016

--*/
angular.module('careWheels')

  .config(function ($stateProvider, $urlRouterProvider) {

    //$urlRouterProvider.otherwise('/');
    $stateProvider

      .state('login', {
        cache: false,
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
      .state('app.vacation', {
        url: '/vacation',
        views: {
          'menuContent': {
            templateUrl: 'views/vacation.html',
            controller: 'vacationController'
          }
        }
      })
      .state('app.advanced', {
        url: '/advanced',
        views: {
          'menuContent': {
            templateUrl: 'views/advanced.html',
            controller: 'AdvancedController'
          }
        }
      });
      $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("app.groupStatus");
      });
  });
