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

    function($scope, $controller, User, $state, $ionicLoading, $ionicHistory, $ionicPopup,
      GroupInfo, $interval, notifications, onlineStatus, Download, $fileLogger,
      fileloggerService, apkDependencies, loginDependencies){

    //
    // When the app starts it enrters via app.js and then execution comes here.
    // The login screen is still not painted at this point. It is painted as we move down
    //

    var popupTemplate = '<ion-spinner></ion-spinner>' + '<p>Contacting Server...</p>';
    var loginTimeout = false;
    $scope.rememberMe = false;

    // When we select "remember credentials" login credentials are stored in localStorage
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
      console.log("TappedOrClicked");
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
          //
          fileloggerService.initLogComponent();
          fileloggerService.logUpload(uname, passwd);
          console.log("Done uploading log file!");

          //
          // Pull up loading overlay so user knows App hasn't frozen
          // This is the twirling icon which says "Contacting Server..."
          //
          $ionicLoading.show({ template: popupTemplate });

          //
          // Notification of user reminder is intialized here. That is if they
          // have set reminders for themselves to take meds, meals etc ...
          //

          notifications.Init_Notifs();        // initialize notifications

          //
          // Here a time out is set and if the server does not come back in
          // loginTimeoutPeriod time then we issue login failed message
          //

          var loginPromise = setTimeout(function(){
            loginTimeout = true;
            $ionicLoading.hide();               // kill the loading screen
            $state.reload();                    // reload the view (try again)
            displayError(0);                    // pop-up error
          }, loginDependencies.loginTimeoutPeriod);

          // do the data download

          Download.DownloadData(function(){
            clearTimeout(loginPromise);       // resolve timeout promise
            if (!loginTimeout){
              scheduleDownload();               // spin up a download/analyze scheduler
              $ionicLoading.hide();             // hide loading screen
              $state.go('app.groupStatus');     // go to group view
            }
          });
        }
      });
    };

    /**
      * This gets scheduled as the last operation of the login process
      * Before exiting this app the download scheduling has to be killed
      * Schedule a download on an interval:
      *      1. download data
      *      2. wait
      *      3. analyze data
      *
    */
    function scheduleDownload(){
        $interval(function(){
          Download.DownloadData(function(){
            console.log('download scheduler finished')
          }); // Download()
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

    //
    // Here if credentials are true meaning it has been saved in the Locoal Storage
    // then the login screen is not even poped. It just logs you in. Autologin
    // was done during developement has been commented out for actual product.

 //   if (credentials)
 //     $scope.login(credentials.username, credentials.password, false);

  });