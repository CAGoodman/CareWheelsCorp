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
      $interval, $timeout, GroupInfo, User, notifications, Download, fileloggerService, apkDependencies,
      loginDependencies){

    $rootScope.fileUploaded = false;   // This will ensure the preLogin messages gets storedin preLogin.log
    fileloggerService.info("Login: Login Controller Entered");

    //
    // When the app starts it enrters via app.js and then execution comes here.
    // The login screen is still not painted at this point. It is painted as we move down
    //

    var loginTimeout = false;
    $scope.rememberMe = false;

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

      fileloggerService.info("Login: Login function Entered");

      //
      // The control passes from here to userService.js/userService.login()
      // It checks with the server and returns the creds or errors out
      //
      User.login(uname, passwd, rmbr).then(function(response) {

        if (User.credentials()) {

          //
          // We wait for the logfile to be created and uploaded too before we start data dowloading
          // This will prevent logfile corruption and dateTimeStamp work properly
          //

          var removeHandler = $rootScope.$on('logfileCreated', function(event, args) {
            removeHandler();          // We have to remove the handler first
            fileloggerService.info("Login: " + args);
            event.stopPropagation();        // Then stop the event propogation

            //
            // Pull up loading overlay so user knows App hasn't frozen
            // This is the twirling icon which says "Contacting Server..."
            //

            User.waitForDataDownload("Login in progress: ");  // Blocking the user till the data download is done

            //
            // Notification of user reminder is intialized here. That is if they
            // have set reminders for themselves to take meds, meals etc ...
            //

            notifications.Init_Notifs();        // initialize notifications

            //
            // Here a time out is set and if the server does not come back in
            // loginTimeoutPeriod time then we issue login failed message. This is non blocking
            // and execution goes down does the DownloadData()
            //

            var loginPromise = $timeout(function(){
              loginTimeout = true;
              User.completedDataDownload("ERROR: Login: Login completed");       // DataDownload completed
              $state.reload();                    // reload the view (try again)
              displayError(0);                    // pop-up error
            }, loginDependencies.loginTimeoutPeriod);


            // do the data download

            Download.DownloadData(function(){
              fileloggerService.info("Login: First time DownloadData function called");
              $timeout.cancel(loginPromise);       // resolve timeout promise
              if (!loginTimeout){
                scheduleDownload();               // spin up a download/analyze scheduler
                User.completedDataDownload("Login: Login completed");       // This kills the loading screen created by waitForDataDownload()
                $state.go('app.groupStatus');     // go to group view
              }
            });
          }); // $on

          //
          // do the log upload. This is where the app talks to the server for credentials authentication
          // The credentials remembering is within the app only the server is unaware of it
          // fileloggerService.info(() executed here will create the logfile
          //

          User.waitForDataDownload("Log file upload in progress: ");  // Blocking the user till logfile upload is done
          fileloggerService.logUpload(uname, passwd, "login");
        }
      });
      fileloggerService.info("Login: Login function Exited");
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
      $rootScope.stopDownloadPromise = $interval(function(){
        Download.DownloadData(function(){
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
    /*
    //
    // When the app is put in background it gets automatically logged off. When it is brought to
    // foreground we need to automatically login. This will happen only if the user had saved
    // credentials. The only issue with this is the user cannot just logoff and be logged off
    // because the below script will log them back. So they have to clean memory and then logout or Force Shutdown.
    //
    if (credentials)
      $scope.login(credentials.username, credentials.password, true);
    */
    fileloggerService.info("Login: Login Controller Exited");
});
