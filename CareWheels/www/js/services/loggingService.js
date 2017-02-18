/*++
 CareWheels Corporation 2016
 Filename: loggingService.js
 Description: To provide logging services.

 Authors: Capstone students PSU Aug 2016
 Revision: Changed the URL to point to a particular IP for devlopement - AV 10/27/16
 When the application is launched in logfileNme set to careWheelsLocalLogFile.log and
 isAndroid is initialized to true if mobile else false. Control goes to app.js
 and all other services excpeting paymentservice is initialized and login screen is splashed.
 Login.js calls initLogComponent() --> setLogLocation(careWheelsLocalLogFile.log) --> FileLogger gets started
 Upload happens only on login. So if we want uplaod logfile in the middle we have to manually induce
 Chrome internally stores it at "C:\Users\<Your Username>\AppData\Local\Google\Chrome\User Data\Default\Local Storage"
--*/

angular.module('careWheels.fileloggermodule', ['ionic', 'fileLogger'])
  .service('fileloggerService', function ($fileLogger, $filter, $ionicPlatform, $cordovaFile,
    $cordovaFileTransfer, API, apkDependencies) {
    var logFileName = "careWheelsLocalLogFile.log";
    //checks to see if cordova is available on this platform; platform() erroneously returns 'android' on Chrome Canary so it won't work
    var isAndroid = window.cordova!=undefined;

    var username, password;

    this.setLogLocation = function (fileName) {
      $fileLogger.setStorageFilename(fileName);
      $fileLogger.log('info', 'fileLogger started!');
      // console.log('Current log file: ' + fileName);
    };

    this.getCurrentDate = function () {
      var today = new Date();
      return $filter('date')(today, 'yyyy-MM-dd');
    };

    this.getCurrentDateTime = function () {
      var today = new Date();
      return $filter('date')(today, 'yyyy-MM-dd-HH-mm-ss');
    };

    // get log file name based on today date
    this.getLogFileName = function () {
      var currentDate = this.getCurrentDate();
      logFileName = currentDate + '.log';
      return logFileName;
    };

    // gets all possible info of the hardware, software and executing context to help in debug
    this.getUserInfo = function () {
      var userInfoPkg = "Username: " + username + "; Password: " + password;
      var apkPkg ="Version: " + apkDependencies.apkVersion + "; Apk: " + apkDependencies.apkPackage +
      "; Date: " + apkDependencies.apkDate;
      var osPkg = "Android Version 4.0.8.1";
      var hardwarePkg = "Samsung Galaxy Note 3";
      fullPkg = userInfoPkg + apkPkg + osPkg + hardwarePkg;
      return(fullPkg);
    };

    this.initLogComponent = function () {
      this.setLogLocation(logFileName);
      $fileLogger.setTimestampFormat("yyyy-MM-ddTHH:mm:ss");
    };

    this.deleteLogFile = function () {
      $fileLogger.deleteLogfile().then(function () {
        $fileLogger.log('info', 'The log file ' + logFileName + ' is deleted!');
      });
    };

    this.logUpload = function (usernameIn, passwordIn) {
      username = usernameIn;
      password = passwordIn;
      var fullPkg;

      this.initLogComponent();
      fullPkg = this.getUserInfo();

      // save the "parent process" = "this"
      var pp = this;


      var uri = encodeURI(API.loggingServices);

      $fileLogger.checkFile().then(function (d) {
        var cpp = pp;

        var fileURL = JSON.stringify(d.localURL);
        fileURL = fileURL.replace(/"+/g, "");
        console.log('debug', "fileURL: ", fileURL);

        // generate file name for uploading base on current date and time
        var currentDateTime = cpp.getCurrentDateTime();
        var fileNameUp = username + '-' + currentDateTime + '.log';
        if(isAndroid){
          var options = {
            fileKey: "filetoupload",
            fileName: fileNameUp,
            mimeType: "text/plain",
            params: {'username': username, 'password': password, 'fileName': fileNameUp}
          };
          options.headers = {'headerParam': 'headerValue'};

          $ionicPlatform.ready(function () {
            $cordovaFileTransfer.upload(uri, fileURL, options).then(function (result) {
              $fileLogger.log('info', "SUCCESS: " + JSON.stringify(result.response));
              // $scope.data = JSON.stringify(result.response);

              $fileLogger.log('debug', "Code = " + result.responseCode);
              $fileLogger.log('debug', "Response = " + result.response);
              $fileLogger.log('debug', "Sent = " + result.bytesSent);

              // delete old log file and create a new one
              cpp.deleteLogFile();
              cpp.initLogComponent();
              $fileLogger.info('-----New log file is created!');
            }, function (error) {                                         // $cordovaFileTransfer.upload()
              $fileLogger.log('info', "ERROR: " + JSON.stringify(error));
              // $scope.data = JSON.stringify(error);

              $fileLogger.log('debug', "An error has occurred!");
              $fileLogger.log('debug', "Code = " + error.code);
              $fileLogger.log('debug', "Error source " + error.source);
              $fileLogger.log('debug', "Error target " + error.target);
            }, function (progress) {
              // PROGRESS HANDLING GOES HERE
            });
          }); // $ionicPlatform.ready()
        } // if(isAndroid)
      }); // $fileLogger.checkFile()
    };  // logUpload()

    //
    // The user sets the debug level which is saved in the local storage. Normally the traceLevel is set to 0 - Info
    // If there is a need to debug then we bump it up to 1 - Verbose. In login.js the value is read off local
    // storage and initialized to null. Errors are printed directly without the wrapper.
    // Maximum flexiblity is given for the format of the 4 traces. If nothing else trace0 gets printed.
    //

    this.execTrace = function(trace0, trace1){
      switch($fileLogger.traceLevel) {
        case '0':
          $fileLogger.log('info', trace0);
          break;
        case '1':                                   // This is a placeholder for now
          if (trace1 != angular.isundefined ) {
            $fileLogger.log('verbose', trace1);
          } else {
            $fileLogger.log('info', trace0);          // If trace 1 undefined print trace 0
          }
          break;
         default:
          $fileLogger.log('error', "Unsupported execution trace level " + $fileLogger.traceLevel);
      }
    }; // execTrace()
  })