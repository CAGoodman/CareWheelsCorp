/*++
 CareWheels Corporation 2016
 Filename: userService.js
 Description: This handles all transactions related to Logging in, vacation mode, getting GroupInfo

 Authors: Capstone students PSU Aug 2016
 Revision: Added a switch statement and cleaned up the tabs increasing readability - AV 11/19/16

--*/

angular.module('careWheels')
// User factory
.factory('User', function ($rootScope, GroupInfo, $http, API, $state, $httpParamSerializerJQLike, $ionicPopup, $ionicLoading,
	$interval, fileloggerService) {
	var user = {};
	var userService = {};
	var failCount = 0;
	user.errorCode = 0;
	
	var paramDB = null;

	
	//
	// login.js/User.login() calls into here for authenticating the creds
	// Window.localStorage['loginCredentials'] = null; // This is where credentials are saved
	//

	userService.login = function (uname, passwd, rmbr) {
		userService.waitForDataDownload("Credentials authentication in progress: ");	// Blocking the user till the creds download is done

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
			userService.hidePassword(response, 'DD');
			fileloggerService.info("UserServ: login: Successfully downloaded credentials: " + JSON.stringify(response.config.data));

			if (rmbr) {		// credentials are saved in local storage. In login.js it is retrived
				// window.localStorage['loginCredentials'] = angular.toJson({"username": uname, "password": passwd});
				userService.writePersistentStorage("loginCredentials", angular.toJson({"username": uname, "password": passwd}));
			} else {
				// window.localStorage.removeItem('loginCredentials');
				userService.deletePersistentStorage("loginCredentials");
			}
			//store user info
			//store groupMember info

			user = {username: uname, password: passwd};

			GroupInfo.initGroupInfo(response.data);
			userService.completedDataDownload("login: Credentials authentication completed");
		}, function errorCallback(response) {
			if (response.data == null) response.data = "";
			userService.hidePassword(response, 'DD');
			userService.completedDataDownload("login: Credentials authentication completed");
			var errorMsg = "Login failed. There might be a network problem:  ";

			fileloggerService.error("UserServ: login:  " + errorMsg + "Status: " + response.status);

			if (failCount >= 3) {
				errorMsg += "Exceeding invalid login attempts. Contact support";
			} else {
				switch(response.status) {
					case -1:
					    if (response.statusText === "") { // When net work is down the errorCode = -1 meaning ERR_NETWORK_IO_SUSPENDED
				            userService.getHttpErrorCode("login: ", response);
				        }
				        errorMsg += response.statusText;
				        break;
				    case 0:
				    	errorMsg += "Network Error";
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
						// The response.data is comning from the OS. This message from OS was observed very consistently
						// Even if this were to change in the future no harm is done!!
						if (response.data === "Your access is blocked by exceeding invalid login attempts") {
							errorMsg += "Account blocked, too many login attempts. Contact support";
						}
						failCount++;
						errorMsg += " Err = " + response.status;
						var alertPopup = $ionicPopup.alert({
							title: 'Login failed [US1]',
							template: [errorMsg + " Err = " + response.status]
						});
						fileloggerService.error("UserServ: login: " + errorMsg + JSON.stringify(response));
						return;
				} // switch
				var alertPopup = $ionicPopup.alert({
					title: 'Login failed [US2]',
					template: [errorMsg + " Err = " + response.status]
				});
				fileloggerService.error("UserServ: login: " + errorMsg + JSON.stringify(response));
			} // else
			user.errorCode = response.status;
			$state.go($state.current, {}, {reload:true})
		})
	};	// userService.login

    userService.waitForDataDownload = function(args) {
        $ionicLoading.show({      //pull up loading overlay so user knows App hasn't frozen
          template: '<ion-spinner></ion-spinner>' +
          args + '<p>Contacting Server...</p>'
        });
    }

	userService.completedDataDownload = function(args) {
		fileloggerService.info("UserServ: " + args);
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
		userService.waitForDataDownload("Vacation setting under progress: ");	// Blocking the user till the data download is done
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
			userService.hidePassword(response, 'VM');
			fileloggerService.info("UserServ: setOnVacation: Successfully updated vacation settings: " + JSON.stringify(response.config.data));
			userService.completedDataDownload("setOnVacation: Vacation setting completed");       // DataDownload completed
			return true;
		},function errorCallback(response) {
			userService.completedDataDownload("setOnVacation: Vacation setting completed");       // DataDownload completed
			userService.hidePassword(response, 'VM');
			var errorMsg = "userService.setOnVacation: ";
			fileloggerService.info("UserServ: setOnVacation: Vacation setting failed. Status: " + JSON.stringify(response));
			for (var i = 0; i < response.data.length; i++) {
				fileloggerService.info("UserServ: setOnVacation: Username: " + response.data[i].username + " Balance: " + response.data[i].balance);
			}

			if (response.status != 200) {
				if (response.status == -1 && response.statusText === "") { // When net work is down the errorCode = -1 meaning ERR_NETWORK_IO_SUSPENDED
            		User.getHttpErrorCode("setOnVacation: ", response);
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

	//
	// As and when we encounter new error code we add it to the switch.
	//

	userService.getHttpErrorCode = function(funcName, response){
	    switch(response.status) {
	      case -1:
	      	response.statusText = "Local Network Error";
	        break;
	      default:
	      	fileloggerService.error("UserServ: " + funcName + "Unknown Error Code: " + user.errorCode + "Error: Unknown network related error");
	    }
	} // userService.getHttpErrorCode


	userService.hidePassword = function(response, event){
		switch (event) {
			// "password=testalice&username=testalice&usernametofind=testalice" --> DownLoad
			// "password=testalice&reminder1=+&reminder2=21:00:00&reminder3=19:00:00&username=testalice&usernametoupdate=testalice" --> Reminder
			case 'DD':
		    	var pos = response.config.data.indexOf("&");  //positioned at the first & which is start of the username
		        response.config.data = response.config.data.slice(pos+1); // password is suppressed!!
		        break;
		   	// "alertlevel=na&callpayment=False&membersummarypayment=True&password=testalice&sensordataviewpayment=False&username=testalice&usernametocredit=testalice&usernametodebt="
		    case 'PS':
				var str = response.config.data;				// Ref: W3 Schools, string manipulation in AngualrJS
				var sln, pos1, pos2, str1, str2;
				sln = str.length; pos1 = str.indexOf("pass"); pos2 = str.indexOf("sensor");
			    str1 = str.substring(0, pos1); str2 = str.substr(pos2, sln);
		        response.config.data = str1 + str2; // password is suppressed!!
		        break;
		   	//"onvacation=false&password=testalice&username=testalice&usernametoupdate=testalice"
		    case 'VM':
				var str = response.config.data;				// Ref: W3 Schools, string manipulation in AngualrJS
				var sln, pos1, pos2, str1, str2;
				sln = str.length; pos1 = str.indexOf("pass"); pos2 = str.indexOf("username");
			    str1 = str.substring(0, pos1); str2 = str.substr(pos2, sln);
		        response.config.data = str1 + str2; // password is suppressed!!
		    	break;
		    default:
		    	fileloggerService.error("UserServ: Unsupported event " + event + " The passwword might have been exposed");
		}
	} // userService.hidePassword()

	//
	// This function gets called when user taps the logout button. Logging out means we get back to the login screen
	// However before getting back we need to ensure the DataDownLoad() which is happening in the background is killed
	//
	userService.logout = function(event){
		// window.localStorage.removeItem("autoLoginCredentials");
		userService.deletePersistentStorage("autoLoginCredentials");
		fileloggerService.info("UserServ: Logout called by: ", event);   // args contains the name of the function calling logout.
	    $interval.cancel($rootScope.downloadPromise);
	    $rootScope.downloadPromise = undefined;
	    $state.go('login', {}, {reload:true});
    }	// userService.logout()
	

	//
	// This function restores the parameters from persistent storage to local storage.
	// So all reads are from local storage using the convenient synchronous calls
	// Precondition: deviceready has fired
	// 
	
	userService.param1ReadSuccess = function (tx, res) {
		window.localStorage.removeItem("loginCredentials");
		fileloggerService.info("userService.param1ReadSuccess: Result length = " + res.rows.length);
		if (res.rows.length > 0) {
			fileloggerService.info("userService.param1ReadSuccess: Param1 = " + res.rows.item(0).rhs);
			window.localStorage.setItem("loginCredentials", res.rows.item(0).rhs);
		}
		$rootScope.paramsRestored = true;
	}
	
	userService.param1ReadError = function 	(e) {
		window.localStorage.removeItem("loginCredentials");
		fileloggerService.info("userService.param1ReadError: " + e);
	}	
	
	userService.param2ReadSuccess = function (tx, res) {
		window.localStorage.removeItem("autoLoginCredentials");
		fileloggerService.info("userService.param2ReadSuccess: Result length = " + res.rows.length);
		if (res.rows.length > 0) {
			fileloggerService.info("userService.param2ReadSuccess: Param2 = " + res.rows.item(0).rhs);
			window.localStorage.setItem("autoLoginCredentials", res.rows.item(0).rhs);
		}
		$rootScope.paramsRestored = true;
	}
	
	userService.param2ReadError = function 	(e) {
		window.localStorage.removeItem("autoLoginCredentials");
		fileloggerService.info("userService.param2ReadError: " + e);
		$rootScope.paramsRestored = true;
	}	
	
	userService.initPersistentStorage = function() {
		paramDB = window.sqlitePlugin.openDatabase({name: 'param.db', location: 'default'});
		fileloggerService.info("userService.initPersistentStorage: Param database opened");
		
		paramDB.transaction(function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS param_table (lhs text primary key, rhs text)');
 			tx.executeSql("SELECT lhs, rhs FROM param_table WHERE lhs = ?", ["loginCredentials"], userService.param1ReadSuccess, userService.param1ReadError);
 			tx.executeSql("SELECT lhs, rhs FROM param_table WHERE lhs = ?", ["autoLoginCredentials"], userService.param2ReadSuccess, userService.param2ReadError);
		});
		
	}	// userService.initPersistentStorage()
	
	userService.writePersistentStorage = function(key, value) {
		if (paramDB == null) {
			fileloggerService.error("userService.writePersistentStorage: Param database uninitialized");
		}
		
		fileloggerService.info("userService.writePersistentStorage: " + key + ":" + value);
		
		paramDB.transaction(function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS param_table (lhs text primary key, rhs text)');
			tx.executeSql("DELETE FROM param_table WHERE lhs = ?", [key], function(tx, res) {
				fileloggerService.info("userService.writePersistentStorage: Delete successful");
 			}, function(e) {
				fileloggerService.error("userService.writePersistentStorage: Delete ERROR: " + e.message);
				return null;
			});
 			tx.executeSql("INSERT INTO param_table (lhs, rhs) VALUES (?,?)", [key, value], function(tx, res) {
				fileloggerService.info("userService.writePersistentStorage: Insert successful " + key + ":" + value);
 			}, function(e) {
				fileloggerService.error("userService.writePersistentStorage: Insert ERROR: " + e.message);
			});
		});	
		
		window.localStorage.setItem(key, value);
	}	// userService.writePersistentStorage()
	
	userService.oldreadPersistentStorage = function(key) {
		if (paramDB == null) {
			fileloggerService.error("userService.readPersistentStorage: Param database uninitialized");
			return null;
		}		
		
		paramDB.transaction(function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS param_table (lhs text primary key, rhs text)');
 			tx.executeSql("SELECT lhs, rhs FROM param_table WHERE lhs = ?", [key], function(tx, res) {
				fileloggerService.info("userService.readPersistentStorage: Select successful: " + key + ":" + res.rows.item(0).rhs);
				return res.rows.item(0).rhs;
 			}, function(e) {
				fileloggerService.error("userService.readPersistentStorage: Select ERROR: " + e.message);
				return null;
			});
		});			
		
	}	// userService.oldreadPersistentStorage()
	
	userService.readPersistentStorage = function(key) {
		return window.localStorage.getItem(key);
	}	// userService.readPersistentStorage()
	
	userService.deletePersistentStorage = function(key) {
		if (paramDB == null) {
			fileloggerService.error("userService.deletePersistentStorage: Param database uninitialized");
			return;
		}
		
		fileloggerService.info("userService.deletePersistentStorage: " + key);
		
		paramDB.transaction(function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS param_table (lhs text primary key, rhs text)');
 			tx.executeSql("DELETE FROM param_table WHERE lhs = ?", [key], function(tx, res) {
				fileloggerService.info("userService.deletePersistentStorage: Delete successful");
 			}, function(e) {
				fileloggerService.error("userService.deletePersistentStorage: Delete ERROR: " + e.message);
				return null;
			});
		});		

		window.localStorage.removeItem(key);
	}	// userService.deletePersistentStorage()

	return userService;
}); // factory

