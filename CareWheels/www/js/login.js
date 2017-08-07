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
      $interval, $timeout, API, GroupInfo, User, notifications, Download, fileloggerService, apkDependencies,
      loginDependencies){

    $ionicHistory.clearHistory();       // This ensures the phone back button is disabled
    $rootScope.fileUploaded = false;   // This will ensure the preLogin messages gets storedin preLogin.log
    fileloggerService.info("Login: Login Controller Entered");
	
	// On application start up, wait until parameters have been restored (asynchronously) from persistent storage
	if ($rootScope.paramsRestored == false) {
		fileloggerService.info("Login: Waiting for params to be restored from persistent storage");
		var paramPromise = $timeout(function(){
            $state.reload();                    // reload the view (try again)
          }, 100);
		return;
	}

    //
    // When the app starts it enters via app.js and then execution comes here.
    // The login screen is still not painted at this point. It is painted as we move down
    //

    var loginTimeout = false;
    $scope.rememberMe = false;
    $scope.userSupport = API.userSupport;

    //
    // If "remember credentials" is selected login credentials are stored in localStorage - userService.js
    // Else it is removed. Here we unconditionally retrive the creds. We either get valid creds or null.
    //

	// var credentials = angular.fromJson(window.localStorage['loginCredentials']);
	var credentials = angular.fromJson(User.readPersistentStorage("loginCredentials"));

    $ionicHistory.nextViewOptions({disableBack: true});

    $scope.showPassword = false;
    $scope.showHelp = false;
    $scope.logoImage = 'img/CareWheelsLogo.png';
    $scope.connectionError = false;
    if (apkDependencies.apkPackagearmv7.search("dbg") == -1)
      $scope.versionNumber = apkDependencies.apkVersion;
    else
      $scope.versionNumber = apkDependencies.apkVersion + " - DEBUG";


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
		  // Save login credentials for auto-login if session is interrupted by the OS reclaiming resources
		  User.writePersistentStorage("autoLoginCredentials", angular.toJson(User.credentials()));
		    
          Download.InitddVar();
          fileloggerService.logUpload(uname, passwd, "login");   // User is authenticated let us load the log file

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
              scheduleDownload();                 // Every 5 minutes data is downloaded
              User.completedDataDownload("Login: Login completed");       // This kills the loading screen created by waitForDataDownload()
              $state.go('app.groupStatus');     // go to group view
            }
          }); // DownloadData()
        } // if (User.credentials)
      }); // User.login()
      fileloggerService.info("Login: Login function Exited");
    };  // login)()

    /**
      * This gets scheduled as the last operation of the login process
      * Before exiting this app the download scheduling has to be killed
      * downloadPromise is the Promise returned that is saved away for later killing
      * Schedule a download on an interval:
      *      1. download data
      *      2. wait
      *      3. analyze data
      *
    */

    function scheduleDownload(){
      $rootScope.downloadPromise = $interval(function(){
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
        'Please try again, or contact support',
        'Please check your internet connection.'
      ];
      var buttonText = [
        'Okay',
        'Retry'
      ];

      var alertPopup = $ionicPopup.alert({
        title: '<div class="errorTitle">Unable to Connect With CareWheels</div> [LG1]',
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
	
  // var autoLoginCredentials = angular.fromJson(window.localStorage['autoLoginCredentials']);
  var autoLoginCredentials = angular.fromJson(User.readPersistentStorage("autoLoginCredentials"));
  if (autoLoginCredentials != undefined)
    fileloggerService.info("On startup. Auto-login credentials are " + autoLoginCredentials.username);

  if (autoLoginCredentials) {
      fileloggerService.info("Performing auto-login");
      // window.localStorage.removeItem("autoLoginCredentials");
	  User.deletePersistentStorage("autoLoginCredentials");
      $scope.login(autoLoginCredentials.username, autoLoginCredentials.password, $scope.rememberMe);
  }
});

