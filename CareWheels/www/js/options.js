//
// CareWheels Corporation 2016
// Filename: options.js
// Description: This introduces new menu item like logout, Screen Refresh, debug
//
// Authors: Ananda Vardhana 11/28/16
// Revision:
//
//
angular.module('careWheels')
.controller('OptionsController', function ($scope, $state, $controller, $ionicPopup, GroupInfo, User,
	Download, apkDependencies) {

  $scope.ScreenRefresh = function () {
    Download.DownloadData(function () {
      console.log('Forced Screen Refresh finished')
    })
  }

  $scope.About = function () {
  	console.log('Name: ' + apkDependencies.apkName)
    console.log('Company: ' + apkDependencies.apkCompany)
    console.log('Version: ' + apkDependencies.apkVersion)
    console.log('Apk: ' + apkDependencies.apkPackage)
    console.log('Date: ' + apkDependencies.apkDate)
  	var aboutEntries = [
  		{ label: 'Name', value: apkDependencies.apkName },
  		{ label: 'Company', value: apkDependencies.apkCompany },
  		{ label: 'Version', value: apkDependencies.apkVersion },
  		{ label: 'Apk', value: apkDependencies.apkPackage },
  		{ label: 'Date', value: apkDependencies.apkDate }
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
  }

  $scope.Logout = function () {
    $state.go('login');
  }
})