//
// CareWheels Corporation 2016
// Filename: menucontroller.js
// Description: When the menu items are clicked the control comes here
//
// Authors: Capstone students PSU Aug 2016
// Revision: Added a nedw menu item called Options - AV 11/28/16
//           Pull up implementation - NXB 01/08/2017
//
//
angular.module('careWheels')

.controller('menu', function ($scope, $state, $ionicHistory, $ionicPopup, apkDependencies) {

    $scope.versionNumber = apkDependencies.apkVersion;

    $scope.navHistory = function() {
      if($ionicHistory.backView() != null) {
        return true;
      }
      return false;
    };

    $scope.goBack = function(){
      $ionicHistory.goBack();
    }

    // Functions for controlling the side menu buttons.
    //

    $scope.clickGroup = function () {
      $state.go('app.groupStatus');
    };

    $scope.clickReminders = function () {
      $state.go('app.reminders');
    };

    $scope.clickSettings = function () {
      $state.go('app.settings');
    };

    $scope.clickTests = function () {
      $state.go('app.tests');
    };

    // ng-model for warning popup checkbox
    $scope.isChecked = {
        value: false
    };

    $scope.clickPocketMother = function() {
        $scope.isChecked.value = false;
        var noWarn = angular.fromJson(window.localStorage["noLeaveAppWarn"]);
        if (!noWarn) {

            $ionicPopup.confirm({
                title: 'You are now leaving CareWheels',
                template: '<ion-checkbox ng-model="isChecked.value" ng-checked="isChecked.value">Do not show again</ion-checkbox>',
                scope: $scope
            })
            .then(function(res) {
                if (res) {
                    if ($scope.isChecked.value)
                        window.localStorage["noLeaveAppWarn"] = angular.toJson($scope.isChecked.value);
                    openSense();
                }
            });

        }
        else
            openSense();
    };

    $scope.clickCyclos = function() {
        $scope.isChecked.value = false;
        var noWarn = angular.fromJson(window.localStorage["noLeaveAppWarn"]);
        if (!noWarn) {

            $ionicPopup.confirm({
                title: 'You are now leaving CareWheels',
                template: '<ion-checkbox ng-model="isChecked.value" ng-checked="isChecked.value">Do not show again</ion-checkbox>',
                scope: $scope
            })
            .then(function(res) {
                if (res) {
                    if ($scope.isChecked.value)
                        window.localStorage["noLeaveAppWarn"] = angular.toJson($scope.isChecked.value);
                    openCyclos();
                }
            });

        }
        else
            openCyclos();
    };

	$scope.clickOptions = function () {
		$state.go('app.options');
    };

    var openSense = function () {
        document.addEventListener("deviceready",
            startApp.set({
                "action": "ACTION_MAIN",
                "category": "CATEGORY_DEFAULT",
                "package":"sen.se.pocketmother",
                "flags": ["FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_CLEAR_TASK"],
                "component": ["sen.se.pocketmother"],
                "intentstart": "startActivity"
            })
            .start(function() {
                console.log("OK");
            }, function(error) {
                $ionicPopup.alert({
                    title: 'Error',
                    subTitle: "Sen.se application not available"
                });
            })
        , false);
    };

    var openCyclos = function () {
        document.addEventListener("deviceready",
            startApp.set({
                "application": "org.cyclos.mobile",
                "action": "ACTION_MAIN",
                "category": "CATEGORY_DEFAULT",
                "package":"org.cyclos.mobile",
                "flags": ["FLAG_ACTIVITY_CLEAR_TOP", "FLAG_ACTIVITY_CLEAR_TASK"],
                "component": ["org.cyclos.mobile"],
                "intentstart": "startActivity"
            })
            .start(function() {
                console.log("OK");
            }, function(error) {
                $ionicPopup.alert({
                    title: 'Error',
                    subTitle: "Cyclos application not available"
                });
            })
        , false);
    };

});
