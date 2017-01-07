/**
 * CareWheels - Login Controller
 *
 */
angular.module('careWheels')
  .controller('loginController',

    function($scope, $controller, User, $state, $ionicLoading, $ionicHistory, $ionicPopup,
      GroupInfo, $interval, notifications, onlineStatus, apkVersion, Download, $fileLogger, fileloggerService){

    var DOWNLOAD_INTERVAL = 1000 * 60 * 5; // constant interval for download, 5 mins
    var LOGIN_TIMEOUT = 1000 * 60;         // timeout for login
    var loginTimeout = false;

    var popupTemplate = '<ion-spinner></ion-spinner>' + '<p>Contacting Server...</p>';

    var credentials = angular.fromJson(window.localStorage['loginCredentials']);

    $ionicHistory.nextViewOptions({disableBack: true});

    //$controller('DownloadCtrl', {$scope : dataDownload});
    //$controller('AnalysisCtrl', {$scope : dataAnalysis});

    $scope.rememberMe = false;
    $scope.logoImage = 'img/CareWheelsLogo.png';
    $scope.connectionError = false;
    $scope.versionNumber = apkVersion;


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
          // do the log upload
          // console.log(uname + " - " + passwd);
          fileloggerService.initLogComponent();
          fileloggerService.logUpload(uname, passwd);
          console.log("Done uploading log file!");

          //pull up loading overlay so user knows App hasn't frozen
          $ionicLoading.show({ template: popupTemplate });

          notifications.Init_Notifs();        // initialize notifications

          var loginPromise = setTimeout(function(){
            loginTimeout = true;
            $ionicLoading.hide();               // kill the loading screen
            $state.reload();                    // reload the view (try again)
            displayError(0);                    // pop-up error
          }, LOGIN_TIMEOUT);


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
     * Interval to check for internet connection.
     * */
    $interval(function(){
      if (!onlineStatus.isOnline() && !$scope.connectionError){
        $scope.connectionError = true;
        displayError(1);
      }
    }, 100);

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
          });
        }, DOWNLOAD_INTERVAL ); // 5 min interval

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


    if (credentials)
      $scope.login(credentials.username, credentials.password, true);

  });
