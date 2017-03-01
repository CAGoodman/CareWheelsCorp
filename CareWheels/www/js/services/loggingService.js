/*++
 CareWheels Corporation 2016
 Filename: loggingService.js
 Description: To provide logging services.

 Authors: Capstone students PSU Aug 2016
 Revision: Changed the URL to point to a particular IP for devlopement - AV 10/27/16
 When the application is launched in logfileNme set to careWheelsLocalLogFile.log and
 isAndroid is initialized to true if mobile else false. Control goes to aself.js
 and all other services excpeting paymentservice is initialized and login screen is splashed.
 Login.js calls initLogComponent() --> setLogLocation(careWheelsLocalLogFile.log) --> FileLogger gets started
 Upload happens only on login. So if we want uplaod logfile in the middle we have to manually induce
 Chrome internally stores it at "C:\Users\<Your Username>\AppData\Local\Google\Chrome\User Data\Default\Local Storage"
--*/

angular.module('careWheels.fileloggermodule', ['ionic', 'fileLogger'])
  .service('fileloggerService', function ($rootScope, $timeout, $q, $fileLogger, $filter, $ionicPlatform,
    $ionicPopup, $cordovaFile, $cordovaFileTransfer, API, apkDependencies) {
    var logFileName = "careWheelsLocalLogFile.log";
    var username, password;

   //checks to see if cordova is available on this platform;
    $rootScope.isAndroid = window.cordova != undefined;

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

    //
    // logUpload() gets called during login which loads the previous lofile.
    //

    this.logUpload = function (usernameIn, passwordIn) {
      //
      // uploadMsg.log will save away the
      // console.log messages we miss out in the main log file careWheelsLocalLogFile.log. When we replace
      // cordova.fileTransfer() then all we need to do is remove isAndroid() check
      //
      window.localStorage.removeItem('uploadMsg.log');
      window.localStorage['uploadMsg.log'] = "***Log messages before uploading the LogFile careWheelsLocalLogFile.log*** \n"
      if (!$rootScope.isAndroid) {
        // no log uploading for web but will support $fileLogger.log
        // The point to note is the logfile is available
        $fileLogger.setTimestampFormat("yyyy-MM-ddTHH:mm:ss");
        $rootScope.fileUploaded = true;
        this.execTrace("LoggingService: Not a Android Device " + "Please contact your friendly CareWheels Customer Support");
        return;
      }

      $rootScope.fileUploaded = false;   // This will ensure the logfile does not get deleted before upload

      // save the reference to this
      var self = this;

      var getFullPkg = function () {
        username = usernameIn;
        password = passwordIn;
        var fullPkg;

        self.initLogComponent();    // Set the correct logfile and also set the correct date format
        fullPkg = self.getUserInfo();
        // $q is a service that helps you run functions asynchronously, and use their return
        // values (or exceptions) when they are done processing. getFullPkg() gets called first
        // as part of logUpload() and then all the rest functions get called. These functions
        // execute asynchronously, but $q gurantees that the get used in the order listed.
        return $q.resolve();
      } // getFullPkg()

      var debugMode = false;               // for dbugging only
      var getFileURL = function () {
        // for dbugging only
        if (debugMode) {
          return $fileLogger.getLogfile().then(function (gotFile) {
            uploadFile = "data:" + gotFile;
          });
          return uploadFile;
        }
        return $fileLogger.checkFile().then(function (checked) {
          self.execTrace("LoggingService: CheckFile() " + "Passed");
          var fileURL = checked.localURL;
          self.execTrace("LoggingService: CheckFileResponse: " + JSON.stringify(checked));
          self.execTrace("LoggingService: URL: " + fileURL);
          return fileURL;
        }).catch(function(reason) {
          $rootScope.fileUploaded = true;  // Logfile was not uploaded but we will let the app execute as normal
          self.execTrace("LoggingService: CheckFile Failed: " + JSON.stringify(reason));
          return;
        })
      } // getFileURL()

      var upload = function (fileURL) {
        // generate file name for uploading base on current date and time
        var currentDateTime = self.getCurrentDateTime();
        var fileNameUp = username + '-' + currentDateTime + '.log';
        self.execTrace("LoggingService: This is indeed a Android platform");
        var options = {
          fileKey: "filetoupload",
          fileName: fileNameUp,
          mimeType: "text/plain",
          params: {'username': username, 'password': password, 'fileName': fileNameUp}
        };
        options.headers = {'headerParam': 'headerValue'};
        self.execTrace("LoggingService: UploadFileName: " + fileNameUp);

        var uri = encodeURI(API.loggingServices8080);
        // Second parameter is a URL for the storage file location - fileURL or the file itself - uploadFile
        //var uploadMsg = window.localStorage['uploadMsg.log']; TBD
        //$cordovaFileTransfer.upload(uri, uploadMsg, options); TBD
        return $cordovaFileTransfer.upload(uri, fileURL, options);

      } // upload()

      var cleanUp = function (result) {
        self.execTrace("LoggingService: Inside FileTransfer Upload");
        self.execTrace("SUCCESS: " + JSON.stringify(result.response));
        self.execTrace("Code = " + result.responseCode);
        self.execTrace("Response = " + result.response);
        self.execTrace("Sent = " + result.bytesSent);
        fileloggerService.execTrace("Done uploading log file!. username: " + usernameIn);

        // delete old log file and create a new one
        self.deleteLogFile();
        self.initLogComponent();
        $fileLogger.log("INFO", "-----New log file was created!"); // This operation will create the lofile.
        $fileLogger.log("INFO", fullPkg); // This will get added to the current new logfile not to the one just uploaded now
        $rootScope.fileUploaded = true;   // LogFile has been uploaded and new logfile created
      }

      //
      // All the above functions in logUpload() gets defined and finally $ionicPlatform.ready() gets called.
      // getFullPkg() runs and as the head of the queue as implemented by $q. getFileUrl(), upload(), cleanup()
      // all run asynchronouly in parallel and when all are done $q ensures the values they generate gets used
      // in the proper order
      //

      $ionicPlatform.ready(function () {
        self.execTrace("LoggingService: Ionic Platform is ready");
        getFullPkg()
          .then(getFileURL)
          .then(upload)
          .then(cleanUp)
          .catch(function (error) {                                         // $cordovaFileTransfer.upload()
            self.execTrace("LoggingService: IF THIS IS A FRESH INSTALL LOGIN, IGNORE: " + JSON.stringify(error));
            self.execTrace("ERROR: " + JSON.stringify(error));
            self.execTrace("An error has occurred!");
            self.execTrace("Code = " + error.code);
            self.execTrace("Error source " + error.source);
            self.execTrace("Error target " + error.target);
            $rootScope.fileUploaded = true;  // Logfile was not uploaded but we will let the app execute as normal
        });
      }); // $ionicPlatform.ready()


    };  // logUpload()

    //
    // The user sets the debug level which is saved in the local storage. Normally the traceLevel is set to 0 - Info
    // If there is a need to debug then we bump it up to 1 - Verbose. In login.js the value is read off local
    // storage and initialized to null. Errors are printed directly without the wrapper.
    // Maximum flexiblity is given for the format of the 4 traces. If nothing else trace0 gets printed.
    //

    this.execTrace = function(trace0, trace1){

      if (!$rootScope.fileUploaded) {  // We have to wait for the old logfile to be uploaded else we will clobber it
        if (trace1 == angular.isundefined) {
          console.log(trace0);
          window.localStorage['uploadMsg.log'] += trace0 + " \n";   // This will catch the earlier log messages
        } else {
          console.log(trace0 + trace1);
          window.localStorage['uploadMsg.log'] += trace0 + trace1;
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