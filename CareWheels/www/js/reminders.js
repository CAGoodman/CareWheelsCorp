/**
 * CareWheels - Reminders Controller
 * For Reminders component, as defined by Design Document. Used for Reminders view (reminders.html) to manage 3 User Reminders.
 * Each Reminder is held in live memory in $scope.reminders[], static memory via NotificationController.data[], in custom fields on the
 * Cyclos server, and in the Notifications Tray (handled by the Notifications component).
 */

angular.module('careWheels')

  .controller('remindersController', (function ($scope, $controller, $ionicPopup, $http, $state, $httpParamSerializerJQLike, User, API, notifications, $fileLogger, fileloggerService) {
    fileloggerService.initLogComponent();
    var data = notifications.getData();

    $scope.reminders = [    //array of live definitions; to be displayed to user
      {
        /* Reminder 0 */
        hour: data[0].hours,
        min: data[0].minutes,
        isPM: false,
        isOn: data[0].on
      },
      {
        /* Reminder 1 */
        hour: data[1].hours,
        min: data[1].minutes,
        isPM: false,
        isOn: data[1].on

      },
      {
        /* Reminder 2 */
        hour: data[2].hours,
        min: data[2].minutes,
        isPM: false,
        isOn: data[2].on
      }
    ];

    for (i = 0; i < 3; ++i) {   //need to convert each from military to conventional time
      if ($scope.reminders[i].hour >= 12)
	$scope.reminders[i].isPM = true;
      if ($scope.reminders[i].hour > 12)
        $scope.reminders[i].hour -= 12;
      if ($scope.reminders[i].hour == 0)
        $scope.reminders[i].hour = 12;
    }

    /**
     *  this function is used to one leading zero
     *  onto minutes that are less than 10
     * */
    $scope.padZero = function (input) {
      if (input < 10)
        return '0' + input;
      else
        return input
    };

    //creates a popup to verify user wants to reset to default Reminder times
    $scope.confirmReset = function () {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Reset',
        template: 'Are you sure you want to reset all Reminders to their default times?'
      });

      confirmPopup.then(function (res) {
        if (res) {
          //if yes button is pressed
          //console.log('clicked confirm delete');

          notifications.Delete_Reminders();  //Delete old reminder files and
          notifications.Init_Notifs();       //reset to default

          //Reset Cyclos custom fields to default
          var myUser = User.credentials();   //retrieve user credentials
          if (myUser != undefined) {
            var rem1 = notifications.Reminder_As_String(0); //notifViewModel.Reminder_As_String(0);
            var rem2 = notifications.Reminder_As_String(1); //notifViewModel.Reminder_As_String(1);
            var rem3 = notifications.Reminder_As_String(2); //notifViewModel.Reminder_As_String(2);

            $scope.CallRest(rem1, rem2, rem3);
          } else {
            console.error("Cannot make REST call in Reminders because user credentials are undefined.");
          }
          $state.go($state.current, {}, {reload: true});    //reset view so changes are immediately visible
	}
      });
    };

    //Push live Reminder values to all other locations
    $scope.saveReminders = function () {
      //update Notification component's memory and local reminder times
      for (var i = 0; i < 3; ++i) {
        var myHours = $scope.reminders[i].hour; // Do nothing for 1AM-11AM and 12PM
	if (myHours == 12 && !$scope.reminders[i].isPM) // 12AM (Midnight) is 00
	  myHours = 0;
	else if (myHours < 12 && $scope.reminders[i].isPM) // 1PM-11PM becomes 13-23
	  myHours = parseInt(myHours) + 12;
        notifications.Create_Notif(myHours, $scope.reminders[i].min, 0, $scope.reminders[i].isOn, i + 1);    //this creates Tray notification and also updates Notification file
        //console.log(myHours + ":" + $scope.reminders[i].min + ":" + 0 + " " + $scope.reminders[i].isOn + i);
      }
      var myUser = User.credentials();   //retrieve user credentials
      if (myUser != undefined) {    //do we have user credentials?
        //update Cyclos server's reminder fields
        if ($scope.reminders[0].isOn == true) {
          var rem1 = notifications.Reminder_As_String(0);
        } else rem1 = '';
        if ($scope.reminders[1].isOn == true) {
          var rem2 = notifications.Reminder_As_String(1);
        } else rem2 = '';
        if ($scope.reminders[2].isOn == true) {
          var rem3 = notifications.Reminder_As_String(2);
        } else rem3 = '';

        //console.log("rem1=" + rem1 + " rem2=" + rem2 + " rem3=" + rem3);
        $scope.CallRest(rem1, rem2, rem3);
      } else{
          console.error("Cannot make REST call in Reminders because user credentials are undefined.");
          if(credentialsError){
            credentialsError = false;
            $fileLogger.log('error', 'Cannot make REST calls for Reminders because user credentials are undefined.');
          }
        }
    };

    //Handle the REST call to custom server API
    $scope.CallRest = function (rem1, rem2, rem3) {
      //restViewModel.fetch(myUser.username, myUser.password, myUser.username, rem1, rem2, rem3);   //will handle generating error if necessary
      var myUser = User.credentials();
      if (myUser != undefined) {
        var status = null;
        var response = null;
        $http({
          url: API.updateUserReminders,
          method: 'POST',    //all our custom REST endpoints have been designed to use POST
          data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
            username: myUser.username,
            password: myUser.password,
            usernametoupdate: myUser.username,
            reminder1: rem1,
            reminder2: rem2,
            reminder3: rem3
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
          }
        }).then(function (response) {    //the old $http success/error methods have been depricated; this is the new format
          status = response.status;
          data = response.data;
          //console.log('Rest Status = ' + status);
        }, function (response) {
          var data = response.data || "Request failed";
          status = response.status;
          if (response.status != 200) {
            //console.error(data);
          } //else console.log('Success: ' + data);
        })
      } else{
          console.error("Cannot make REST call in Reminders because user credentials are undefined.");
          if(credentialsError){
            credentialsError = false;
            $fileLogger.log('error', 'Cannot make REST calls for Reminders because user credentials are undefined.');
          }
        }
    };
  }));


