/*++ 
 CareWheels Corporation 2016
 Filename: groupStatus.js
 Description: Group Status controller 

 Authors: Capstone students PSU Aug 2016
 Revision: Enabled center user - AV 12/18/2016
 Notes: The control enters via the HTML displays the page in accordance to the style 
 dictated by the CSS file and JS files takes care of the action part. Like what happens
 when the user clicks.
 In JavaScript, scope is the set of variables, objects, and functions you have access to.
 $scope is defined as part of the function call. Any variales including function names included as 
 the part of argument becomes accessible globally. Anything defined inside the function remains local
 Ex: The function Download in login.js has been declared globally and hence could be called by option.js
--*/
angular.module('careWheels').controller('groupStatusController',
function ($scope, $interval, $state, $ionicPopup, GroupInfo, User, PaymentService) {

	runOnStateChange();


	/**
	 *  this function is invoked with each state change to this view.
	 */
	function runOnStateChange() {
		console.log('crediting user for group summary view.');
		PaymentService.memberSummary(0.1);

		// the groupInfo object is not available immediately, spin until available
		// toDo: remove this once the callbacks for downland and analysis are set up
		var initGroupInfo = setInterval(function () {
			var groupArray = GroupInfo.groupInfo();
			if (groupArray[0] != null) {
				clearInterval(initGroupInfo);
				getLoggedInUser(groupArray);
				setGroupArray(groupArray);
				checkVacationMode();
			}
		}, 50);
	}

	function checkVacationMode() {
		if (User.getVacationValue())
			$('#vacationMode').fadeIn(0);
		else
			$('#vacationMode').fadeOut(0);
	}


    /** automatically go through each user square, and
     *  find each 'red' alert, and fade that element in
     *  and out. (flashing effect)
     * */
    $interval(function () {
		/* jQuery element to fade in and out */
		var alertArray = [
			$('#centerAlert'),
			$('#topLeftAlert'),
			$('#topRightAlert'),
			$('#bottomLeftAlert'),
			$('#bottomRightAlert')
		];
		for (var i = 0; i < alertArray.length; i++) {
			if (alertArray[i].css('background-color') === 'rgb(239, 71, 58)') {
				alertArray[i].fadeOut("slow");
				alertArray[i].fadeIn("slow");
			}
		}
    }, 2000);
	/* Here we have discrete 5 group onr for each of the 5 users. I feel there is some repetition
	but will not fix it if it ain't broken. Just added group 0 for the center user*/
    $scope.group = [
		{ // center, self
			name: '',
			username: '',
			status: '',
			image: '',
			alertLevelColor: '',
			error: false 
		},
		{ // top left @ index 1
			name: '',
			username: '',
			status: '',
			image: '',
			alertLevelColor: '',
			error: false
		},
		{ // top right @ index 2
			name: '',
			username: '',
			status: '',
			image: '',
			alertLevelColor: '',
			error: false
		},
		{ // bottom left @ index 3
			name: '',
			username: '',
			status: '',
			image: '',
			alertLevelColor: '',
			error: false
		},
		{ // bottom right @ index 4
			name: '',
			username: '',
			status: '',
			image: '',
			alertLevelColor: '',
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
    // lets figure out which user logged in at this point
    function getLoggedInUser(groupInfo) {
		var user = User.credentials();
		// error unable to load user object;
		if (user == null) {
			$scope.group[0].selfUserIndex = -1;
		}

		// loop through the groupInfo array to find the user who
		// logged in.
		for (var i = 0; i < groupInfo.length; i++) {
			if (user.username == groupInfo[i].username) {
				$scope.group[0].selfUserIndex = i; // gotcha!
				return true;
			}
		}
    }

    // now lets set the scope variables for the group view.
    function setGroupArray(groupArray) {
		var currentUser = 0;
		var fridgeAlert, medsAlert;

		var loggedInUserIndex = $scope.group[0].selfUserIndex;

		// next lets set the data for the user that logged in,
		// this is reserved at index zero.
		$scope.group[currentUser].image = groupArray[loggedInUserIndex].photoUrl;
		$scope.group[currentUser].username = groupArray[loggedInUserIndex].username;
		$scope.group[currentUser].name = groupArray[loggedInUserIndex].name;
		$scope.group[currentUser].balance = trimZeros(groupArray[loggedInUserIndex].balance);
		//$scope.group[currentUser].onVacation = User.getVacationValue();

		currentUser++; // = 1 at this point

		// put everyone else into the array
		for (var i = 0; i < 5; i++) {
			// skip the user who logged in
			if (i != $scope.group[0].selfUserIndex) {
				$scope.group[currentUser].image = groupArray[i].photoUrl;
				$scope.group[currentUser].username = groupArray[i].username;
				$scope.group[currentUser].name = groupArray[i].name;

				try {
					fridgeAlert = groupArray[i].analysisData.fridgeAlertLevel;
					medsAlert = groupArray[i].analysisData.medsAlertLevel;
					$scope.group[currentUser].status = $scope.getAlertColor(fridgeAlert, medsAlert, i);
				}
				catch (Exception) {
					$scope.group[currentUser].status = 'grey';
					$scope.group[currentUser].error = true;
				}
				currentUser++;
			}
			// on the last element of the loop, now check health
			if (i == 4) {
				if (!GroupInfo.getSensorError())
					$scope.checkGroupHealth();
			}

		}
    }

    //removes insignificant zeros
    function trimZeros(input) {
		var number = parseFloat(input);
		return number.toString();
    }

    function clickUser(index) {
		if (!$scope.group[index].error) {
			PaymentService.sensorDataView(0.1, $scope.group[index].alertLevelColor);
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
    $scope.getAlertColor = function (fridgeAlert, medsAlert, index) {
		// check for null params
		if (fridgeAlert == null || medsAlert == null) {
			return '';
		}
		var fridge = parseInt(fridgeAlert);
		var meds = parseInt(medsAlert);
		var alertString = '';

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
		$scope.group[index].alertLevelColor = alertString;
		return alertString;
    };

    $scope.checkGroupHealth = function () {
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
    };

 });
