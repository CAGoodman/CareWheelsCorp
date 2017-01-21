/* eslint-env angular */
/*++
 CareWheels Corporation 2016
 Filename: login.js aka Login Controller
 Description: Getting the user credential, getting it authenticated by the server
 then pulling the data of the server is done here

 Authors: Capstone students PSU Aug 2016
 Revision: Added logout, remember, forgot credentials - AV 0108/2017

--*/

angular.module('careWheels')
  .controller('loginController',

    function($scope, $controller, User, $state, $ionicLoading, $ionicHistory, $ionicPopup,
      GroupInfo, $interval, notifications, onlineStatus, apkVersion, Download, $fileLogger,
      fileloggerService, downloadInterval, loginTimeoutPeriod, chkNetDayFreq, chkNetNightFreq,
      checkNetworkInterval, beginNightTime, endNightTime){

    // downloadInterval, loginTimeoutPeriod, chkNetDayFreq, chkNetNightFreq have all been declared
    // as constants in package.json. downloadInterval = 1000 * 60 * 5 (5 mins)
    // loginTimeoutPeriod = 1000 * 60 (1 min), chkNetDayFreq = 100, chkNetNightFreq = 10000
    // checkNetworkInterval = 1000 * 60 * 5 (5 mins) and beginNightTime, endNightTime are set to 10 PM
    // and 6PM. For the current setting please check package.json.

    var loginTimeout = false;

    var popupTemplate = '<ion-spinner></ion-spinner>' + '<p>Contacting Server...</p>';

    // When we select remember this is where the login credentials are stored.
    // Right here storage
    var credentials = angular.fromJson(window.localStorage['loginCredentials']);

    $ionicHistory.nextViewOptions({disableBack: true});

    //$controller('DownloadCtrl', {$scope : dataDownload});
    //$controller('AnalysisCtrl', {$scope : dataAnalysis});

    $scope.rememberMe = false;
    $scope.showPassword = false;
    $scope.showHelp = false;
    $scope.logoImage = 'img/CareWheelsLogo.png';
    $scope.connectionError = false;
    $scope.versionNumber = apkVersion;

    //
    // If the remember me set then the credential is in the local memory so can be written
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
      User.login(uname, passwd, rmbr).then(function(response) {

        if (User.credentials()) {
          //
          // do the log upload. This is where the app talks to the server for credentials authentication
          // The credential remembering is within the app only the server is unaware of it
          //
          fileloggerService.initLogComponent();
          fileloggerService.logUpload(uname, passwd);
          console.log("Done uploading login credentials to the server for authentication!");

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
          }, loginTimeoutPeriod);


          // do the data download
          Download.DownloadData(function(){
            clearTimeout(loginPromise);       // resolve timeout promise
            if (!loginTimeout){
              scheduleDownload();               // spin up a download/analyze scheduler
              $ionicLoading.hide();             // hide loading screen
              $state.go('app.groupStatus');     // go to group view
            }
          });
          scheduleNetWorkChecking();            // Check network connectivity
        }
      });
    };

//
//  scheduleNetWorkChecking() is scheduled for every 5 min. It is internally it does its job every 5 min.
//  Depending on the  time of the day beginNightTime or endNightTime the frequencey at which network
//  connectivity checking varies between chkNetDayFreq and chkNetNightFreq which are defined as constants
//  in package.json. Everytime there is a switch the previous net work check timer is cleared.
//

    var setDay = false;
    var setNight = false;
    var chkNetIndex = true;
    var d, h;
    function scheduleNetWorkChecking(){
      $interval(function(){
        d = new Date();
        h = d.getHours();
        if (h <= beginNightTime || h >= endNightTime) {           // Day time between 6AM and 10PM
          if (setDay == false) {
            setDay = true;
            setNight = false;
            clearInterval(chkNetIndex);
            chkNetIndex = setInterval(function(){
              if (!onlineStatus.isOnline() && !$scope.connectionError){
                $scope.connectionError = true;
                displayError(1);
              }
            }, chkNetDayFreq);                                      // Check more frequently
          }
        } else {                                                    // Night time between 10PM and 6AM
          if (setNight == false) {
            setNight = true;
            setDay = false;
            clearInterval(chkNetIndex);
            chkNetIndex = setInterval(function(){
              if (!onlineStatus.isOnline() && !$scope.connectionError){
                $scope.connectionError = true;
                displayError(1);
              }
            }, chkNetNightFreq);                                      // Check less frequently
          }
        } // else
      }, checkNetworkInterval); // 5 min interval
    }

    /**
     * Schedule a download every on an interval:
     *      1. download data
     *      2. wait
     *      3. analyze data
     * */
    function scheduleDownload(){
        $interval(function(){
          Download.DownloadData(function(){
            console.log('download scheduler finished')
          }); // Download()
        }, downloadInterval); // 5 min interval

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