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
  .service('fileloggerService', function ($fileLogger, $filter, $ionicPlatform, $ionicPopup, $cordovaFile,
    $cordovaFileTransfer, API, apkDependencies) {
    var logFileName = "careWheelsLocalLogFile.log";
    //checks to see if cordova is available on this platform; platform() erroneously returns 'android' on Chrome Canary so it won't work
    var isAndroid = window.cordova != undefined;
    var username, password;

    this.fileUploaded = false;   // This will ensure the logfile does not get deleted before upload

    this.setLogLocation = function (fileName) {
      $fileLogger.setStorageFilename(fileName);
      //
      // Right now the name of the file and time stamp is done but the file itself
      // is not created. The first $fileLogger.log() will create it. We dont want to
      // create the file right now because we want the old one from previous run to
      // be uploaded first. Hence the first $fileLogger.log() is in login.js
      //
      this.execTrace("Log file name: " + fileName + " was initialized");
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
      var dlfthis = this;
      $fileLogger.deleteLogfile().then(function () {
        dlfthis.execTrace("The log file " + logFileName + " is deleted!");
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

      var uri = encodeURI(API.loggingServices8080);
      $fileLogger.checkFile().then(function (checked) {
        var cpp = pp;
        cpp.execTrace("LoggingService: CheckFile() " + "Passed");
        var fileURL = JSON.stringify(checked.localURL);
        fileURL = fileURL.replace(/"+/g, "");
        cpp.execTrace("LoggingService: CheckFileResponse: " + JSON.stringify(checked));
        cpp.execTrace("LoggingService: URL: " + fileURL);

        // generate file name for uploading base on current date and time
        var currentDateTime = cpp.getCurrentDateTime();
        var fileNameUp = username + '-' + currentDateTime + '.log';
        if(isAndroid){
          cpp.execTrace("LoggingService: This is indeed a Android platform");
          var options = {
            fileKey: "filetoupload",
            fileName: fileNameUp,
            mimeType: "text/plain",
            params: {'username': username, 'password': password, 'fileName': fileNameUp}
          };
          options.headers = {'headerParam': 'headerValue'};
          cpp.execTrace("LoggingService: UploadFileName: " + fileNameUp);

          $ionicPlatform.ready(function () {
            $cordovaFileTransfer.upload(uri, fileURL, options).then(function (result) {
              cpp.execTrace("LoggingService: Inside FileTransfer Upload");
              cpp.execTrace("SUCCESS: " + JSON.stringify(result.response));
              cpp.execTrace("Code = " + result.responseCode);
              cpp.execTrace("Response = " + result.response);
              cpp.execTrace("Sent = " + result.bytesSent);

              // delete old log file and create a new one
              cpp.deleteLogFile();
              cpp.initLogComponent();
              $fileLogger.log("INFO", "-----New log file was created!"); // This operation will create the lofile.
              cpp.fileUploaded = true;        // LogFile has been uploaded and new logfile created
            }, function (error) {                                         // $cordovaFileTransfer.upload()
              cpp.execTrace("LoggingService: IF THIS IS A FRESH INSTALL LOGIN, IGNORE: " + JSON.stringify(error));
              cpp.execTrace("ERROR: " + JSON.stringify(error));
              cpp.execTrace("An error has occurred!");
              cpp.execTrace("Code = " + error.code);
              cpp.execTrace("Error source " + error.source);
              cpp.execTrace("Error target " + error.target);
              cpp.fileUploaded = true;  // Logfile was not uploaded but we will let the app execute as normal
            }, function (progress) {
              // PROGRESS HANDLING GOES HERE
            }); // $cordovaFileTransfer.upload()
          },  function(s) {
                pp.fileUploaded = true;  // Logfile was not uploaded but we will let the app execute as normal
                pp.execTrace("LoggingService: Ionic Platform Not ready: " + JSON.stringify(s));
              }); // $ionicPlatform.ready()
        }   else {
              pp.fileUploaded = true;  // Logfile was not uploaded but we will let the app execute as normal
              pp.execTrace("LoggingService: Not a Android Device " + "Please contact your friendly CareWheels Customer Support");
            }; // if(isAndroid)
      },  function(s) {
            pp.fileUploaded = true;  // Logfile was not uploaded but we will let the app execute as normal
            pp.execTrace("LoggingService: CheckFile Failed: " + JSON.stringify(s));
        }); // $fileLogger.checkFile()
    };  // logUpload()

    //
    // The user sets the debug level which is saved in the local storage. Normally the traceLevel is set to 0 - Info
    // If there is a need to debug then we bump it up to 1 - Verbose. In login.js the value is read off local
    // storage and initialized to null. Errors are printed directly without the wrapper.
    // Maximum flexiblity is given for the format of the 4 traces. If nothing else trace0 gets printed.
    //

    this.execTrace = function(trace0, trace1){

      if (!this.fileUploaded) {  // We have to wait for the old logfile to be uploaded else we will clobber it
        if (trace1 == angular.isundefined) {
          console.log(trace0);
        } else {
          console.log(trace0 + trace1);
        }
        return;
      }

      switch($fileLogger.traceLevel) {
        case '0':
          $fileLogger.log("INFO", trace0);
          break;
        case '1':                                   // This is a placeholder for now
          if (trace1 != angular.isundefined ) {
            $fileLogger.log("DEBUG", trace1);
          } else {
            $fileLogger.log("INFO", trace0);          // If trace 1 undefined print trace 0
          }
          break;
         default:
          $fileLogger.log("ERROR", "Unsupported execution trace level " + $fileLogger.traceLevel);
      }
    }; // execTrace()
  })