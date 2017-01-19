/*++
 CareWheels Corporation 2016
 Filename: userService.js
 Description: This handles all transactions related to Logging in, vacation mode, getting GroupInfo

 Authors: Capstone students PSU Aug 2016
 Revision: Added a switch statement and cleaned up the tabs increasing readability - AV 11/19/16

--*/

angular.module('careWheels')
// User factory
.factory('User', function (GroupInfo, $http, API, $state, $httpParamSerializerJQLike, $ionicPopup, $ionicLoading) {
	var user = {};
	var userService = {};
	var failCount = 0;
	//window.localStorage['loginCredentials'] = null; // This is where credentials are saved

	userService.login = function (uname, passwd, rmbr) {
		$ionicLoading.show({      //pull up loading overlay so user knows App hasn't frozen
		  template: '<ion-spinner></ion-spinner>' +
		  '<p>Contacting Server...</p>'
		});

		return $http({
			url: API.userAndGroupInfo,
			method: 'POST',
			data: $httpParamSerializerJQLike({
				username: uname,
				password: passwd,
				usernametofind: uname
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}).then(function (response) {
			if (rmbr) {					// In case of Android we need to figure out how to cler memory
				window.localStorage['loginCredentials'] = angular.toJson({"username": uname, "password": passwd});
			} else {
				window.localStorage.removeItem('loginCredentials');
			}
				//store user info
				//store groupMember info

				user = {username: uname, password: passwd};

				GroupInfo.initGroupInfo(response.data);
				$ionicLoading.hide();   //make sure to hide loading screen
			}, function (response) {
			//present login failed
			$ionicLoading.hide();
			var errorMsg = "Unknown error.";

			//CHECKING TO FOR 404 ERRROR
			//response.status = 404;
			//response.data = "nothing";
			//
			console.log(response.status);
			console.log(response.data);

			if (failCount >= 3) {
				errorMsg = "Exceeding invalid login attempts. Please Contact admin";
			} else {
				switch(response.status) {
					case 400:
						errorMsg = "Please check your credentials! ";
						break;
					case 401:
						errorMsg = "The entered username is incorrect. ";
						break;
					case 404:
						errorMsg = "Unable to reach the server ";
						break;
					default:
						if (response.data === "Your access is blocked by exceeding invalid login attempts") {
							errorMsg = "Account got blocked by exceeding invalid login attempts. Please contact admin";
						}
						failCount++;
						var alertPopup = $ionicPopup.alert({
							title: 'Login failed!',
							template: errorMsg,
							template: response.data
						});
						return;
				} // switch
				var alertPopup = $ionicPopup.alert({
					title: 'Login failed!',
					template: [errorMsg + response.data]
				});
			} // else
		})
	};	// userService.login

    userService.credentials = function () {
		if (!user.username)
			return null;
		return user;
    };

    userService.getVacationValue = function () {
		var creds = userService.credentials();
		var currentUserObject = GroupInfo.getMember(creds.username);
		// console.log("currentUserobject is: " + currentUserObject);

		for(var i = 0; i < currentUserObject.customValues.length; i++) {

			if (currentUserObject.customValues[i].field.internalName == "onVacation") {
				// console.log("Found custom field onVacation!");
				//console.log("Setting value to: " + currentUserObject.customValues[i].booleanValue);
				return currentUserObject.customValues[i].booleanValue;
			}
		} // for

		return null;
    };

    userService.setVacationValue = function (newValue) {
		var creds = userService.credentials();
		var currentUserObject = GroupInfo.getMember(creds.username);
		// console.log("currentUserobject is: " + currentUserObject);
		for(var i = 0; i < currentUserObject.customValues.length; i++) {
			if (currentUserObject.customValues[i].field.internalName == "onVacation") {
				// console.log("Found custom field onVacation!");
				// console.log("Setting local value to: " + currentUserObject.customValues[i].booleanValue);
				currentUserObject.customValues[i].booleanValue = newValue;
				//console.log("Local value is now: " + currentUserObject.customValues[i].booleanValue);
			}
		}
    };

    userService.setOnVacation = function (uname, passwd, onVacationSetting) {
		$ionicLoading.show({      //pull up loading overlay so user knows App hasn't frozen
			template: '<ion-spinner></ion-spinner>' +
			'<p>Contacting Server...</p>'
		});

		return $http({
			url: API.updateSettings,
			method: 'POST',
			data: $httpParamSerializerJQLike({
				username: uname,
				password: passwd,
				usernametoupdate: uname,
				onvacation: onVacationSetting
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}).then(function (response) {
			console.log("Successfully updated setting!");
			$ionicLoading.hide();
			return true;
		},function (response) {

			$ionicLoading.hide();
			var errorMsg = "Unknown error.";
			//
			console.log(response.status);
			console.log(response.data);

			if (response.status != 200) {
			  errorMsg = "Unable to update settings on server!";
			}

			var alertPopup = $ionicPopup.alert({
			  title: 'Settings update failed!',
			  template: errorMsg
			});

			return false;
		})
	};	// userService.setOnVacation

	return userService;
}); // factory

