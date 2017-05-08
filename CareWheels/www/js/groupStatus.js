/*++
 CareWheels Corporation 2016
 Filename: groupStatus.js
 Description: Group Status controller

 Authors: Capstone students PSU Aug 2016
 Revision: Enabled center user - AV 12/18/2016
 		   Implement Refresh on pull up - NXB 01/09/2017
 		   Changes made to meds red alert so as to not to invoke mutple timer instances NXB/AV 01/18/2017
 Notes: The control enters via the HTML displays the page in accordance to the style
 dictated by the CSS file and JS files takes care of the action part. Like what happens
 when the user clicks.
 In JavaScript, scope is the set of variables, objects, and functions you have access to.
 $scope is defined as part of the function call is applicable to this controller only. $scope ties variables to html.
 Any variales including function names included as the part of argument becomes accessible globally.
 Anything defined inside the function remains local
--*/

angular.module('careWheels').controller('groupStatusController',
function ($rootScope, $scope, $interval, $state, $ionicHistory, $ionicPopup, $log, fileloggerService,
	GroupInfo, User, PaymentService, Download, loginDependencies) {

	fileloggerService.info("GSCtrl: Group Status controller Entered");

	//
	// Any time the main screen i.e. group status screen is to be displayed this groupStatusController()
	// will be called and that calls runOnStateChange().
	//

	$scope.showBar = false;
	$scope.barLegend = "";
    $ionicHistory.clearHistory();
	runOnStateChange();


	//
	//  this function is invoked with each state change to this view.
	//

	function runOnStateChange() {
		//fileloggerService.info("GSCtrl:runOnStateChange: Entering Group Status screen");
		var creds = User.credentials();

		// The groupInfo object is not available immediately, spin until available
		// It is happening in back ground with the server hence wait for 50 mili seconds
		// toDo: remove this once the callbacks for downland and analysis are set up
		// Note: Any call enclosed between $interval() does not just fall through when stepping.
		// groupArray[0] to grou[[4] has users in the same order irrespective of the user logged in

		var initGroupInfoPromise = $interval(function () {
			var groupArray = GroupInfo.groupInfo();
			if (groupArray[0] != null) {			// [0] has to be filled in so its full indicates work is done
				$interval.cancel(initGroupInfoPromise);		// Clear the timer
				if (!getLoggedInUser(groupArray)) {
					return;
				}
				setGroupArray(groupArray);			// This is a critical call which sets the group of 5
				checkCenterUserAlertLevel();
			}
			if ($rootScope.autoRefresh) {			//Skipping crediting user for group summary view because of auto-refresh
				$rootScope.autoRefresh = false;
			}
			else {
				fileloggerService.info("GSCtrl: runOnStateChange: Crediting user for group summary view " + "Username: " + creds.username);
				PaymentService.memberSummary();
			}
		}, loginDependencies.downloadTime); 	// 50 mili sec delay to allow the download to happen

		//
		// From here the control just drops down to the first code executing inside the controller.
		// There it  displays the GroupStatus screen and then drops down to alertArry[] to take care of the alerts
		//
		//fileloggerService.info("GSCtrl:runOnStateChange: Exiting Group Status screen");
	}	//runOnStateChange().

	//
	// For center user i.e., logged in user we are not flashing alert but putting a red bar hence need to be discovered
	// In setGroupArray() the logged in user info is stuffed to groupArray[0] but its AlertColor was not discovered
	//

	function checkCenterUserAlertLevel() {
		var creds = User.credentials();
		var groupArray = GroupInfo.groupInfo();
		$scope.showBarCB = true;
		$scope.barLegendCB = "Care Bank";
		$scope.barClassCB = "bar-positive";
		var status;	// Precdence is set as - Vacation, grey, red, yellow, blue
		var loggedInUserIndex = $scope.group[0].selfUserIndex;
		//fileloggerService.info("GSCtrl:checkCenterUserAlertLevel: Enter");
		//
		// We cannot use $scope.group[] here becasue that has not been saved hence we use groupArray[]
		//
		status = getAlertColor(groupArray[loggedInUserIndex].analysisData.fridgeAlertLevel,
			groupArray[loggedInUserIndex].analysisData.medsAlertLevel, User.getVacationValue());
		switch (status) {
			case "grey":
				$scope.showBarVM = true;
				$scope.barLegendVM = "Vacation Mode On";
				$scope.barClassVM = "bar-positive";
				break;
			case "red":
				$scope.showBarVM = true;
				$scope.barLegendVM = "Check Your Alert!";
				$scope.barClassVM = "bar-assertive";
				break;
			case "yellow":
				$scope.showBarVM = true;
				$scope.barLegendVM = "Check Your Alert!";
				$scope.barClassVM = "bar-energized";
				break;
			case "blue":
				$scope.showBarVM = false;
				break;
			default:
				$ionicPopup.alert({
		            title: "Vacation mode not set. Status: " + status + " Alert level undetected for Username: " + creds.username,
		            subTitle: "Please contact your friendly CareBank customer support for help"
	        	});
				fileloggerService.error("GSCtrl: checkCenterUserAlertLevel:Bad alert status: " + status + "Username: " + creds.username);
				$scope.showBarVM = false;
		}	// switch()
		if (i > loginDependencies.userCount) {
			$ionicPopup.alert({
	            title: "Vacation mode not set. " + i + " user count exceeds expected user count " + loginDependencies.userCount,
	            subTitle: "Please contact your friendly CareBank customer support for help"
	    	});
			fileloggerService.error("GSCtrl: checkCenterUserAlertLevel:Username: " + creds.username + " is missing");
		}
		//fileloggerService.info("GSCtrl:checkCenterUserAlertLevel: Exit");
		return;
	}

	//
	// From runOnStateChange() the control comes down here to automatically go through each id(#),
	// and enable in the object fadeIn and FadeOut. Please note the id objects are just being
	// initialized at this point what action to take i.e., flash or not to flash decision is taken later
    // RedAlert is set for all users expcept center user.Center user we are just going to put a red bar
    // #centerAlert is not part of the alertArray[]
    //

	var redAlertPromise = $interval(function () {
		/* jQuery element to fade in and out */
		var alertArray = [				// alertArray is initailized with id from the html here
			$('#topLeftAlert'),
			$('#topRightAlert'),
			$('#bottomLeftAlert'),
			$('#bottomRightAlert')
			];

		//
		// The id's in the alertArray is connected to the CSS file definition of background-color
		// The id's support fadeOut and fadeIn methods which are initialized. Whether to actually
		// do the action is decided if the alert is set. Here the html is just made ready, no action.
		// centerUser, index 0 is also initialized although it takes different  action then flashing.
		//

		for (var i = 0; i < alertArray.length; i++) {
			if (alertArray[i].css('background-color') === 'rgb(239, 71, 58)') {		// 239, 71, 58
				alertArray[i].fadeOut("slow");
				alertArray[i].fadeIn("slow");
			}
		}
    }, loginDependencies.redAlertFreq);		// This is the frequencey at which the red alert will flash

	// Alert promise is saved which is cleared in app.js when there is a state change
	$rootScope.redAlertPromise = redAlertPromise;

	//
	// Here we have discrete 5 group onr for each of the 5 users.
	//

    $scope.group = [
		{ // center, self
			name: '',
			username: '',
			status: '',
			image: '',
			error: false
		},
		{ // top left @ index 1
			name: '',
			username: '',
			status: '',
			image: '',
			error: false
		},
		{ // top right @ index 2
			name: '',
			username: '',
			status: '',
			image: '',
			error: false
		},
		{ // bottom left @ index 3
			name: '',
			username: '',
			status: '',
			image: '',
			error: false
		},
		{ // bottom right @ index 4
			name: '',
			username: '',
			status: '',
			image: '',
			error: false
		}
    ];

    /* click/press events */
    $scope.clickCenter = function () {
		clickUser(0);
    };
    $scope.clickTopLeft = function () {
		clickUser(1);
    };
    $scope.clickTopRight = function () {
		clickUser(2);
    };
    $scope.clickBottomLeft = function () {
		clickUser(3);
    };
    $scope.clickBottomRight = function () {
		clickUser(4);
    };

   	// pulldown refresh event
    $scope.doRefresh = function () {
        Download.DownloadData(function(){
            //$scope.$broadcast('scroll.refreshComplete');
            fileloggerService.info("GSCtrl: doRefresh: Pull down refresh done!");
            $state.go($state.current, {}, {reload: true});
        });
     };	// doRefresh()

    //
    // lets figure out which user logged in at this point. The data from the server always comes
    // in the order of user assigned Index. The user indices are LeftTop = 0, Center = 1, RightTop = 2
    // LeftBottom = 3 and RightBottom = 4
    //

    function getLoggedInUser(groupInfo) {
		var user = User.credentials();
		// error unable to load user object;
		if (user == null || user == undefined) {
			$ionicPopup.alert({
	            title: "Username is missing or undefined",
	            subTitle: "Please contact your friendly CareBank customer support for help"
	        });
		} else {

			// loop through the groupInfo array to find the user who
			// logged in.
			for (var i = 0; i < groupInfo.length; i++) {
				if (user.username == groupInfo[i].username) {
					$scope.group[0].selfUserIndex = i; // gotcha!
					return true;
				}
			}
			$ionicPopup.alert({
	            title: "Username: " + user.username + " is missing or undefnined",
	            subTitle: "Please contact your friendly CareBank customer support for help"
		    })
	    }
	    fileloggerService.error("GSCtrl: getLoggedInUser(): Unknown username: " + user.username);
	    $rootScope.$emit('Logout', "groupStatus:getLoggedInUser()");
	    return false;
	}	// getLoggedInUser()

    //
    // $scope.group[] is tied to the html screen and groupArray[] is the data coming from the server
    // Now let us set the scope variables for the group view. group[] is populated here
    // User creds, special settings and alerts are saved here in the group[]
    // Logged in user data is directed to the center user i.e., $scope.group[0] . Index 0 is reserved for the center user
    // So if you were to login 5 times as different users you would see users occupying different parts of the screen
    //

    function setGroupArray(groupArray) {
    	//fileloggerService.info("GSCtrl:setGroupArray: Enter");
		var currentUser = 0;
		var fridgeAlert, medsAlert;
		// loggedInUserIndex can vary from 0 - 4 but group[0] will be alaways = logged in user
		var loggedInUserIndex = $scope.group[0].selfUserIndex;

		// next lets set the data for the user that logged in,
		// this is reserved at index zero.

		$scope.group[currentUser].image = groupArray[loggedInUserIndex].photoUrl;
		$scope.group[currentUser].username = groupArray[loggedInUserIndex].username;
		$scope.group[currentUser].name = groupArray[loggedInUserIndex].name;
		$scope.group[currentUser].balance = groupArray[loggedInUserIndex].analysisData.balance;
		$scope.group[currentUser].credit = groupArray[loggedInUserIndex].analysisData.credit;
		$scope.group[currentUser].debit = groupArray[loggedInUserIndex].analysisData.debit;
		$scope.group[currentUser].vacationMode = groupArray[loggedInUserIndex].analysisData.vacationMode;
		fridgeAlert = groupArray[loggedInUserIndex].analysisData.fridgeAlertLevel;
		medsAlert = groupArray[loggedInUserIndex].analysisData.medsAlertLevel;
		vacationMode = groupArray[loggedInUserIndex].analysisData.vacationMode;
		$scope.group[currentUser].status = getAlertColor(fridgeAlert, medsAlert, vacationMode); // HTML changed so that this user's "status" has no effect on display

		currentUser++; // = 1 at this point
		// put everyone else into the array
		for (var i = 0; i < loginDependencies.userCount; i++) {
			if (i != loggedInUserIndex) {		// loggedInUserIndex has already been saved to group[0]
				$scope.group[currentUser].image = groupArray[i].photoUrl;
				$scope.group[currentUser].username = groupArray[i].username;
				$scope.group[currentUser].name = groupArray[i].name;
				$scope.group[currentUser].vacationMode = groupArray[i].analysisData.vacationMode;

				try {
					fridgeAlert = groupArray[i].analysisData.fridgeAlertLevel;
					medsAlert = groupArray[i].analysisData.medsAlertLevel;
					vacationMode = groupArray[i].analysisData.vacationMode;
					$scope.group[currentUser].status = getAlertColor(fridgeAlert, medsAlert, vacationMode);
				}
				catch (Exception) {
					$scope.group[currentUser].status = 'grey';
					$scope.group[currentUser].error = true; //LoggedInUser error is not set
				}
				currentUser++;
			}  // if()
			// on the last element of the loop, now check health
			if (i == loginDependencies.userCount - 1) {
				if (!GroupInfo.getSensorError())
					checkGroupHealth();
			}
		}	// for()
		//fileloggerService.info("GSCtrl:setGroupArray: Exit");
    }	// setGroupArray();

    //
    // The user has tapped on an individual at this point and immidiatley contorl passes for Payment
    // In case the user is on vacation the click is ignored
    //

    function clickUser(index) {
		if (!$scope.group[index].error && !$scope.group[index].vacationMode) {
			PaymentService.sensorDataView($scope.group[index].status, $scope.group[index].username);
			$scope.group[0].userSelected = $scope.group[index].name;
			GroupInfo.setSelectedMemberIndex($scope.group[index].username);
			$state.go('app.individualStatus');
		}
    }

    // An error popup dialog
    function displayError(errorString) {
		var alertPopup = $ionicPopup.alert({
			title: '<div class="errorTitle">Unable to load sensor data for:</div>',
			template: '<div class="errorTemplate">' + errorString + '</div>',
			buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
				text: 'Okay',
				type: 'button-calm'
			}]
		});
		alertPopup.then(function (res) {

		});
    }


    /**
     * returns a string of of the color code depending on the
     * alert level. This string is used with ng-class, to
     * append the color class onto the div
     * */
    getAlertColor = function (fridgeAlert, medsAlert, vacationMode) {
		if (vacationMode) {
 			alertString = 'grey';
 			return alertString;
		}
		var fridge = parseInt(fridgeAlert);
		var meds = parseInt(medsAlert);
		// var alertString = '';

		// check for acceptable bounds
		if (meds < 0 || fridge < 0)
			alertString = ''; // error state
		// check for null
		else if (fridge >= 2 || meds >= 2)
			alertString = 'red';
		else if (fridge == 1 || meds == 1)
			alertString = 'yellow';
		else if (fridge == 0 || meds == 0)
			alertString = 'blue';
		return alertString;
    };	// getAlertColor();

    checkGroupHealth = function () {
		//create a template string
		var errorList = [];
		var errorCount = 0;
		for (var i = 1; i < $scope.group.length; i++) {
			if ($scope.group[i].error) {
				errorCount++;
				errorList.push(String($scope.group[i].name));
			}
			// on the last element now
			if (i == $scope.group.length - 1) {
				// no errors? then return
				if (errorCount == 0) {
					GroupInfo.setSensorError(false);
					return true;
				}
				// error found! set the error variable
				if (errorCount > 0)
					GroupInfo.setSensorError(true);

				//lets craft up a string to be displayed
				var errorString = '';
				for (var j = 0; j < errorList.length; j++) {
					errorString += errorList[j];
					if (j < errorList.length - 2)
						errorString += ', ';
					else if (j == errorList.length - 2)
						errorString += ' and ';
					else if (j == errorList.length - 1) {
						// were done, display error message now
						if (!$scope.group[0].displayedError) {
							$scope.group[0].displayedError = true;
							displayError(errorString);
						}
					}
				}
			}
		}
    };	// checkGroupHealth();
    fileloggerService.info("GSCtrl: Group Status controller Exited");
 });
