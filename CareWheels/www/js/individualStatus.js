/*++
 CareWheels Corporation 2016
 Filename: individualStatus.js
 Description: Individual Status Controller

 Authors: Capstone students PSU Aug 2016
 Revision:
 Notes: The control enters via the HTML displays the page in accordance to the style
 dictated by the CSS file and JS files takes care of the action part. Like what happens
 when the user clicks.
 In JavaScript, scope is the set of variables, objects, and functions you have access to.
 $scope is defined as part of the function call is applicable to this controller only.
 Any variales including function names included as the part of argument becomes accessible globally.
 Anything defined inside the function remains local
 --*/

angular.module('careWheels')
  .controller('individualStatusController',
      function ($scope, $state, $ionicPopup, GroupInfo, PaymentService,
                  fileloggerService, Download, User, loginDependencies) {

  $scope.$on('onPaused', function(event, args) {
    console.log("IS: OnPause got it!!");
  });

  $scope.$on('onResumed', function(event, args) {
    console.log("IS: onResume got it!!");
  })

    /**
     * grabs the analysis of the member selected on the previous view
     */
    var analysis = GroupInfo.getSelectedMemberIndex();
    $scope.GroupInfo = GroupInfo;
    var timeNow = new Date().getHours();
    var phoneNumberError = false;

    $scope.alertLevel = '';

    function convertMedsOrMealsAlertLevelToColor(sensorArray) {

      var coloredArray = [];

      for (var i = 0; i < sensorArray.length; i++) {

        if (sensorArray[i] == 0) {
          coloredArray[i] = "blue";
        }

        if (sensorArray[i] == 1) {
          coloredArray[i] = "yellow";
        }

        if (sensorArray[i] >= 2) {
          coloredArray[i] = "red";
        }
      }

      return coloredArray;
    }

    function convertPresenceAlertLevelToColor(sensorArray) {
      var coloredArray = [];

      for (var i = 0; i < sensorArray.length; i++) {

        if (sensorArray[i] == false) {
          coloredArray[i] = "grey";
        }

        if (sensorArray[i] == true) {
          coloredArray[i] = "blue";
        }
      }
      return coloredArray;
    }

    function convertHitsToString(hitsArray) {

      var stringArray = [];
      var hitIndicator = "";

      for (var i = 0; i < hitsArray.length; i++) {

        for (var j = 0; j < hitsArray[i]; j++) {
          if (j > loginDependencies.maxHitIndicator) {    // 5
            break;
          }

          hitIndicator += "X";
        }

        stringArray[i] = hitIndicator;
        hitIndicator = "";
      }

      return stringArray;
    }

    $scope.currentHour = new Date().getHours();
    $scope.getNumber = function (num) {
      return new Array(num);
    }

    $scope.data = {

      presence: {
        value: convertPresenceAlertLevelToColor(analysis.analysisData.presenceByHour)
      },

      meals: {
        value: convertMedsOrMealsAlertLevelToColor(analysis.analysisData.fridgeRollingAlertLevel),
        hits: convertHitsToString(analysis.analysisData.fridgeHitsByHour)
      },

      meds: {
        value: convertMedsOrMealsAlertLevelToColor(analysis.analysisData.medsRollingAlertLevel),
        hits: convertHitsToString(analysis.analysisData.medsHitsByHour)
      }

    };

    /**
     * This function returns the color for the call button.
     */
    $scope.getCallButtonColor = function () {
      var msg = " Username: " + analysis.username + " Balance: " + analysis.balance;
      fileloggerService.info("IndividualStatus: GetCallButtonColor()" + msg);

      $scope.showCallButton = true;

      // We disable Call button for logged in user

      var user = User.credentials();
      if (user.username == analysis.username) {
         $scope.showCallButton = false;
        return 'disableCallButton';
      }

      // check for null params
      if (analysis.analysisData.fridgeAlertLevel == null || analysis.analysisData.medsAlertLevel == null)
        return 'button-dark disableCallButton';

      var fridge = parseInt(analysis.analysisData.fridgeAlertLevel);
      var meds = parseInt(analysis.analysisData.medsAlertLevel);

      // this string must match the defined css class names
      var returnString = '';

      // check for acceptable bounds or null phone number disable button if true
      if (meds < 0 || fridge < 0 || analysis.phoneNumber == null) {
        returnString += 'disableCallButton'; // error state
      }

      // check for color status of button
      if (fridge >= 2 || meds >= 2) {
        returnString += ' button-assertive';  // Red
      }
      else if (fridge == 1 || meds == 1) {
        returnString += ' button-energized';  // Yellow
      }
      else {
        returnString += ' button-dark disableCallButton';
         $scope.showCallButton = false;
      }
      return returnString;
    }; // getCallButtonColor()

    /**
     * This function takes the phone number string returned from Cyclos (which
     * is in the incorrect format), and it changes the string to a format
     * necessary for making a call. Note: if no phone number is put on the
     * Cyclos server, the number (000) 000-0000 will be inserted. This indicates
     * that the number needs to be placed in the system.
     */
    $scope.getPhoneNumber = function () {
      var msg = " Username: " + analysis.username + " Balance: " + analysis.balance;
      fileloggerService.info("IndividualStatus: GetPhoneNumber() hit" + msg);
      var cyclosPhoneNumber = analysis.phoneNumber;

      if (cyclosPhoneNumber == null) {
        cyclosPhoneNumber = "+00000000000";
        phoneNumberError = true;             // this will trigger popup when phone button is pressed
      }

      var callString = "tel:";
      callString = callString + cyclosPhoneNumber.substring(2, 5) + "-" + cyclosPhoneNumber.substring(5, 8) +
       "-" + cyclosPhoneNumber.substring(8);
      var msg = "Username: " + analysis.username + " Balance: " + analysis.balance;
      fileloggerService.info("IndividualStatus: " + msg);
      var alertNumFridge = analysis.analysisData.fridgeAlertLevel;
      var alertNumMeds = analysis.analysisData.medsAlertLevel;
      //
      // Alert intervals are defined for time ranges- 6:00AM-10:59AM, 11:00AM-3:59PM and 4:00PM-9:59PM.
      // If there are no events and the interval is enabled for alerts and the user is present the alert is raised.
      // fridgeAlertLevel is raised by 1(yellow) and medsAlertLevel is raised by 2(red).
      // If the same condition persists for the next time interval food alerts goes red.
      // fridgeAlertLevel escalates by 1 and medsAlertLevle escalates by 2
      //
      //
      var alertLevel = '';
      if (alertNumMeds >= 2) {
        alertLevel = 'red';
      } else {
        if (alertNumFridge == 1){
          alertLevel = 'yellow';
        }
      }
      $scope.alertLevel = alertLevel;
      return callString;
    };  // getPhoneNumber()

    // button press event
    $scope.checkPhoneError = function () {
      if (phoneNumberError) {
        displayError();
        fileloggerService.error("There is no phone number for " + analysis.name);
      }
      else if ($scope.alertLevel != '') {
        PaymentService.call(analysis.username, $scope.alertLevel);
      }
    };  // checkPhoneError()

    // pulldown refresh event
    $scope.doRefresh = function () {
      Download.DownloadData(function(){
        //$scope.$broadcast('scroll.refreshComplete');
        fileloggerService.info("IndividualStatus: Pull down refresh done!");

        //
        // Back and forward arrows help to go back/forward the the immidiate past or future screen.
        // As we move from screen to screen back/forward an index is maintained. So if we ant to jump into
        // the index then we use $stat.go. The current index is alwsys = 0.
        //

        $state.go($state.current, {}, {reload: true});
      });
    };

    $scope.name = analysis.name;
    $scope.phoneNumber = analysis.phoneNumber;


    // An error popup dialog
    function displayError() {
      phoneNumberError = true;
      var alertPopup = $ionicPopup.alert({
        title: '<div class="errorTitle">There is no phone number for this member.</div>',
        template: '<div class="errorTemplate">Please contact the system administrator.</div>',
        buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
          text: 'Okay',
          type: 'button-calm'
        }]
      });
      alertPopup.then(function (res) {

      });
    }
  });
