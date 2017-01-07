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
.controller('OptionsController', function ($scope, $controller, $ionicPopup, GroupInfo, User,
	Download, apkName, apkCompany, apkVersion, apkDate, apkPackage) {
  $scope.ScreenRefresh = function () {
    Download.DownloadData(function () {
      console.log('Forced Screen Refresh finished')
    })
  }

  $scope.About = function () {
  	console.log('Name: ' + apkName)
    console.log('Company: ' + apkCompany)
    console.log('Version: ' + apkVersion)
    console.log('Apk: ' + apkPackage)
    console.log('Date: ' + apkDate)
  	var aboutEntries = [
  		{ label: 'Name', value: apkName },
  		{ label: 'Company', value: apkCompany },
  		{ label: 'Version', value: apkVersion },
  		{ label: 'Apk', value: apkPackage },
  		{ label: 'Date', value: apkDate }
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
})
