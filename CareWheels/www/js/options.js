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
	Download, name, title, version, apk, date) {
  $scope.ScreenRefresh = function () {
    Download.DownloadData(function () {
      console.log('Forced Screen Refresh finished')
    })
  }

  $scope.About = function () {
  	console.log('Name: ' + name)
    console.log('Title: ' + title)
    console.log('Version: ' + version)
    console.log('Apk: ' + apk)
    console.log('Date: ' + date)
  	var aboutEntries = [
  		{ label: 'Name', value: name },
  		{ label: 'Title', value: title },
  		{ label: 'Version', value: version },
  		{ label: 'Apk', value: apk },
  		{ label: 'Date', value: date }
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
