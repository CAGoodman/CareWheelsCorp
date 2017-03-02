/* eslint-env angular */
/*++
 CareWheels Corporation 2016
 Filename: login.js aka Login Controller
 Description: Getting the user credential, getting it authenticated by the server
 then pulling the data of the server is done here

 Authors: Capstone students PSU Aug 2016
 Revision: Added logout, remember, forgot credentials - AV 0108/2017

apkDependencies has been declared in package.json --> ngConstatnts.js
loginDependencies has been declared in appConstatnts.js
downloadInterval = 1000 * 60 * 5 (5 mins)
loginTimeoutPeriod = 1000 * 60 (1 min),
For the current setting please check ngConstants.js or appConstants.js

--*/

angular.module('careWheels')
  .controller('loginController',

    function($rootScope, $scope, $controller, $state, $ionicLoading, $ionicHistory, $ionicPopup,
      $interval, $timeout, $fileLogger, GroupInfo, User, notifications, Download, fileloggerService, apkDependencies,
      loginDependencies, traceControls){

    //
    // When the app starts it enrters via app.js and then execution comes here.
    // The login screen is still not painted at this point. It is painted as we move down
    //

    var loginTimeout = false;
    $scope.rememberMe = false;

    //
    // execTraceLevel is the Key or  the address or the name of the storage space. traceFilter is the name/address/index of the Value
    // in the Key. Key[Value] = 1234 :: execTraceLevel[traceFilter] = 0x1234. How the Value is stored is format independent. In the
    // case of execTraceLevel we are saving it like an array. Ex: message.log just stores it like a string.
    // $fileLogger.traceLevel is initialized and stored values is initialized to NULL, default value so
    // that run of the app is back to normal trace level.
    //

    var traceLevel = angular.fromJson(window.localStorage['execTraceLevel']);
    if (traceLevel == angular.isundefined) {
      $fileLogger.traceLevel = traceControls.info;      // Defined in appConstants.js
    }
    else {
      $fileLogger.traceLevel = traceLevel.traceFilter;  // From what ever was stored in the memory
    }

    window.localStorage['execTraceLevel'] = angular.toJson({"traceFilter": traceControls.info}); // Stored value is set to Info - 0

    //
    // If "remember credentials" is selected login credentials are stored in localStorage - userService.js
    // Else it is removed. Here we unconditionally retrive the creds. We either get valid creds or null.
    //

    var credentials = angular.fromJson(window.localStorage['loginCredentials']);

    $ionicHistory.nextViewOptions({disableBack: true});

    $scope.showPassword = false;
    $scope.showHelp = false;
    $scope.logoImage = 'img/CareWheelsLogo.png';
    $scope.connectionError = false;
    $scope.versionNumber = apkDependencies.apkVersion;

    //
    // If the rememberMe is set then the credentials are in the local memory so can be written
    // back on the login screen.
    //

    if (credentials)  {
      $scope.username = credentials.username;
      $scope.passwd = credentials.password;
      $scope.rememberMe = true;
    }

    $scope.TappedOrClicked = function() {
      console.log("TappedOrClicked. username: " + $scope.username + " password: " + $scope.passwd);
      $scope.showHelp = true;
    }

    /**
     * Login function is called from app.js. This method
     * goes through the following steps
     *
     *      1. login into the carebank
     *      2. download data from sen.se
     *      3. analyze the data
     *      4. if success - redirect to group view, otherwise
     *         reload the login controller, and try again.
     *         (user will have to manually input credentials at this point)
     * */
    $scope.login = function(uname, passwd, rmbr) {
      //
      // The control passes from here to userService.js/userService.login()
      // It checks with the server and returns the creds or errors out
      //
      User.login(uname, passwd, rmbr).then(function(response) {

        if (User.credentials()) {

          //
          // do the log upload. This is where the app talks to the server for credentials authentication
          // The credentials remembering is within the app only the server is unaware of it
          // fileloggerService.execTrace(() executed here will create the logfile
          //

          fileloggerService.logUpload(uname, passwd);

          //
          // Pull up loading overlay so user knows App hasn't frozen
          // This is the twirling icon which says "Contacting Server..."
          //

          User.waitForDataDownload();  // Blocking the user till the data download is done


          //
          // Notification of user reminder is intialized here. That is if they
          // have set reminders for themselves to take meds, meals etc ...
          //

          notifications.Init_Notifs();        // initialize notifications

          //
          // Here a time out is set and if the server does not come back in
          // loginTimeoutPeriod time then we issue login failed message
          //

          var loginPromise = $timeout(function(){
            loginTimeout = true;
            User.completedDataDownload();       // DataDownload completed
            $state.reload();                    // reload the view (try again)
            displayError(0);                    // pop-up error
          }, loginDependencies.loginTimeoutPeriod);

          // do the data download

          Download.DownloadData(function(){
            $timeout.cancel(loginPromise);       // resolve timeout promise
            if (!loginTimeout){
              scheduleDownload();               // spin up a download/analyze scheduler
              User.completedDataDownload();       // DataDownload completed
              $state.go('app.groupStatus');     // go to group view
            }
          });
        }
      });
    };

    /**
      * This gets scheduled as the last operation of the login process
      * Before exiting this app the download scheduling has to be killed
      * User.stopDownload is the Promise returned that is saved away for later killing
      * Schedule a download on an interval:
      *      1. download data
      *      2. wait
      *      3. analyze data
      *
    */

    function scheduleDownload(){
      User.stopDownloadPromise = $interval(function(){
        Download.DownloadData(function(){
          fileloggerService.execTrace("Download scheduler finished");
          if ($state.current.name == "app.groupStatus") {
            $rootScope.autoRefresh = true;
          }
          $state.go($state.current, {}, {reload:true});
        });
      }, loginDependencies.downloadInterval); // 5 min interval
    }

    // An error popup dialog
    function displayError(index) {
      var errorStrings = [
        'Please try again, or contact a system administrator.',
        'Please check your internet connection.'
      ];
      var buttonText = [
        'Okay',
        'Retry'
      ];

      var alertPopup = $ionicPopup.alert({
        title: '<div class="errorTitle">Unable to Connect With CareWheels</div>',
        template: '<div class="errorTemplate">' + errorStrings[index] + '</div>',
        buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
          text: buttonText[index],
          type: 'button-calm'
        }]
      });
      alertPopup.then(function (res) {
        // only set this bool to false if its a connection error
        if (index == 1)
          $scope.connectionError = false;
      });
    }
});
