/*++
 CareWheels Corporation 2016
 Filename: userService.js
 Description: This handles all transactions related to Logging in, vacation mode, getting GroupInfo

 Authors: Capstone students PSU Aug 2016
 Revision: Added a switch statement and cleaned up the tabs increasing readability - AV 11/19/16

--*/

angular.module('careWheels')
// User factory
.factory('User', function (GroupInfo, $http, API, $state, $httpParamSerializerJQLike, $ionicPopup, $ionicLoading,
	fileloggerService) {
	var user = {};
	var userService = {};
	var failCount = 0;
	user.errorCode = 0;
	//
	// login.js/User.login() calls into here for authenticating the creds
	// Window.localStorage['loginCredentials'] = null; // This is where credentials are saved
	//

	userService.login = function (uname, passwd, rmbr) {
		userService.waitForDataDownload();	// Blocking the user till the data download is done
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
		}).then(function successCallback(response) {
			if (rmbr) {		// credentials are saved in local storage. In login.js it is retrived
				window.localStorage['loginCredentials'] = angular.toJson({"username": uname, "password": passwd});
			} else {
				window.localStorage.removeItem('loginCredentials');
			}
				//store user info
				//store groupMember info

				user = {username: uname, password: passwd};

				GroupInfo.initGroupInfo(response.data);
				userService.completedDataDownload();       // DataDownload completed
		}, function errorCallback(response) {
			//present login failed
			userService.completedDataDownload();       // DataDownload completed
			var errorMsg = "userService.login: Login failed:  ";

			fileloggerService.error(errorMsgStatus + "Status: " + response.status);

			if (failCount >= 3) {
				errorMsg += "Exceeding invalid login attempts. Please Contact admin";
			} else {
				switch(response.status) {
					case -1:
					    if (response.statusText === "") { // When net work is down the errorCode = -1 meaning ERR_NETWORK_IO_SUSPENDED
				            User.getHttpErrorCode("userService.login: ", response);
				        }
					case 400:
						errorMsg += "Please check your credentials! ";
						break;
					case 401:
						errorMsg += "The entered username is incorrect. ";
						break;
					case 404:
						errorMsg += "Unable to reach the server ";
						break;
					default:
						if (response.data === "Your access is blocked by exceeding invalid login attempts") {
							errorMsg += "Account got blocked by exceeding invalid login attempts. Please contact admin";
						}
						failCount++;
						var alertPopup = $ionicPopup.alert({
							title: 'Login failed!',
							template: [errorMsg + response.data]
						});
						fileloggerService.error(errorMsg + JSON.stringify(response));
						return;
				} // switch
				var alertPopup = $ionicPopup.alert({
					title: 'Login failed!',
					template: [errorMsg + response.data]
				});
				fileloggerService.error(errorMsg + JSON.stringify(response));
			} // else
			user.errorCode = response.status;
			$state.go($state.current, {}, {reload:true})
		})
	};	// userService.login

    userService.waitForDataDownload = function() {
        $ionicLoading.show({      //pull up loading overlay so user knows App hasn't frozen
          template: '<ion-spinner></ion-spinner>' +
          '<p>Contacting Server...</p>'
        });
    }

	userService.completedDataDownload = function() {
  		$ionicLoading.hide();               // kill the loading screen
    }

	//
	// If error code is set we return null. All User.credentials() call end up here.
	//

    userService.credentials = function () {
		if (user.errorCode || !user.username) {
			return null;
		}
		return user;
    };

    userService.getVacationValue = function () {
		var creds = userService.credentials();
		var currentUserObject = GroupInfo.getMember(creds.username);
		return (currentUserObject.analysisData.vacationMode);
    };

    userService.setOnVacation = function (uname, passwd, onVacationSetting) {
		userService.waitForDataDownload();	// Blocking the user till the data download is done
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
		}).then(function successCallback(response) {
			fileloggerService.info("userService.setOnVacation: Successfully updated vacatoin settings!");
			userService.completedDataDownload();       // DataDownload completed
			return true;
		},function errorCallback(response) {
			userService.completedDataDownload();       // DataDownload completed
			var errorMsg = "userService.setOnVacation: ";

			fileloggerService.info("userService.setOnVacation: Vacation setting failed. Status: " + response.status);
			for (var i = 0; i < response.data.length; i++) {
				fileloggerService.info("userService.setOnVacation: Username: " + response.data[i].username + " Balance: " + response.data[i].balance);
			}

			if (response.status != 200) {
				if (response.status == -1 && response.statusText === "") { // When net work is down the errorCode = -1 meaning ERR_NETWORK_IO_SUSPENDED
            		User.getHttpErrorCode("userService.setOnVacation: ", response);
          		}
			  	errorMsg = "Unable to update settings on server!";
			}

			var alertPopup = $ionicPopup.alert({
			  title: 'Settings update failed!',
			  template: errorMsg
			});
			fileloggerService.error("userService.setOnVacation: " + JSON.stringify(response));
			return false;
		})
	};	// userService.setOnVacation

	userService.getHttpErrorCode = function(funcName, response){
	    switch(response.status) {
	      case -1:
	      	response.statusText = "ERR_NETWORK_IO_SUSPENDED";
	        break;
	      default:
	      	fileloggerService.error(funcName + "Unknown Error Code: " + errorCode + "Error: Some unknown network related error");
	    }
	} // userService.getHttpErrorCode

	return userService;
}); // factory

