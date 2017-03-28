//
// CareWheels Corporation 2016
// Filename: menucontroller.js
// Description: When the menu items are clicked the control comes here
//
// Authors: Capstone students PSU Aug 2016
// Revision: Added a new menu item called Advanced - AV 11/28/16
//           Pull up implementation - NXB 01/08/2017
//
//
angular.module('careWheels')

.controller('menu', function ($scope, $state, $ionicHistory, $ionicPopup, apkDependencies, User, fileloggerService) {

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

    $scope.clickVacation = function () {
      $state.go('app.vacation');
    };

    $scope.clickTests = function () {
      $state.go('app.tests');
    };

    // ng-model for warning popup checkbox
    $scope.isChecked = {
        value: false
    };

    $scope.clickPocketMother = function() {
        fileloggerService.execTrace("MenuCtrl:clickPocketMother: Enter");
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
                    fileloggerService.execTrace("MenuCtrl:clickPocketMother: Exit");
                    openSense();
                }
            });

        }
        else {
            fileloggerService.execTrace("MenuCtrl:clickPocketMother: Exit");
            openSense();
        }
    };

    $scope.clickCyclos = function() {
        fileloggerService.execTrace("MenuCtrl:clickCyclos: Enter");
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
                    fileloggerService.execTrace("MenuCtrl:clickCyclos: Exit");
                    openCyclos();
                }
            });

        }
        else {
            fileloggerService.execTrace("MenuCtrl:clickCyclos: Exit");
            openCyclos();
        }
    };

	$scope.clickAdvanced = function () {
		$state.go('app.advanced');
    };

    $scope.clickHelp = function () {
        $ionicPopup.alert({
            title: 'Help',
            subTitle: "Help menu under construction!!"
        });
    };

    $scope.clickAbout = function () {

        fileloggerService.execTrace('Name: ' + apkDependencies.apkName);
        fileloggerService.execTrace('Company: ' + apkDependencies.apkCompany);
        fileloggerService.execTrace('Version: ' + apkDependencies.apkVersion);
        fileloggerService.execTrace('Apk: ' + apkDependencies.apkPackage);
        fileloggerService.execTrace('Date: ' + apkDependencies.apkDate);
        var aboutEntries = [
            { label: 'Name', value: apkDependencies.apkName },
            { label: 'Company', value: apkDependencies.apkCompany },
            { label: 'Version', value: apkDependencies.apkVersion },
            { label: 'Apk', value: apkDependencies.apkPackage },
            { label: 'Date', value: apkDependencies.apkDate },
            { label: 'Cordova Version', value: window.device.cordova },
            { label: 'Model and Manufacturer', value: window.device.model + " " + window.device.manufacturer},
            { label: 'Serial Number and UUID', value: window.device.serial +  " " +window.device.uuid}
        ]

        var template = ''
        aboutEntries.forEach(function (item) {
          template += '<ion-item>' +
            '<ion-label item-left>' + item.label + '</ion-label>' +
            '<ion-note item-right>' + item.value + '</ion-note>' +
          '</ion-item>'
        })

        template = '<ion-list>' + template + '</ion-list>'
        var alertPopup = $ionicPopup.alert({
          title: 'About CareBank Application',
          template: template
        });
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
                fileloggerService.execTrace("Sen.Se Pocketmother application Entered");
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
                fileloggerService.execTrace("Cyclos application Entered");
            }, function(error) {
                $ionicPopup.alert({
                    title: 'Error',
                    subTitle: "Cyclos application not available"
                });
            })
        , false);
    };

});
