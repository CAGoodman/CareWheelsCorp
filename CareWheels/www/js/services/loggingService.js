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
  .service('fileloggerService', function ($rootScope, $timeout, $interval, $q, $fileLogger, $filter, $ionicPlatform,
    $ionicPopup, $cordovaFile, $cordovaFileTransfer,  $cordovaAppVersion, API, apkDependencies) {

    var logFileName = "careWheelsLocalLogFile.log";
    var username, password;

   //checks to see if cordova is available on this platform;
    $rootScope.isAndroid = window.cordova !== undefined;

    this.setLogLocation = function (fileName) {
      $fileLogger.setStorageFilename(fileName);
      //
      // Right now the name of the file and time stamp is done but the file itself
      // is not created. The first $fileLogger.log() will create it. We dont want to
      // create the file right now because we want the old one from previous run to
      // be uploaded first. Hence the first $fileLogger.log() is in login.js
      //
      //bugbugthis.info("Log file name: " + fileName + " was initialized");
    };

    this.getCurrentDateTime = function () {
      var today = new Date();
      return $filter('date')(today, 'yyyy-MM-dd-HH-mm-ss');
    };

    // gets all possible info of the hardware, software and executing context to help in debug
    this.getUserInfo = function () {
      var headerPkg   = "Logfile Header For User: " + username + "\n"
      var cordovaPkg  = "Cordova Version: " + window.device.cordova + "\n";
      var apkPkg      = apkDependencies.apkPackage + " Version " + apkDependencies.apkVersion;
      var datePkg     = " APK Date: " + apkDependencies.apkDate;
      var osPkg       = "OS: " + window.device.platform + " Version: " + window.device.version + "\n";
      var hardwarePkg = "Model and Manufacturer: " + window.device.model + " " + window.device.manufacturer + "\n";
      var IDPkg       = "Serial Number: " + window.device.serial + " UUID: " + window.device.uuid + "\n";
      fullPkg = headerPkg + cordovaPkg + apkPkg + datePkg + osPkg + hardwarePkg + IDPkg;
      return fullPkg;
    };

    this.initLogComponent = function () {
      this.setLogLocation(logFileName);
      $fileLogger.setTimestampFormat("yyyy-MM-ddTHH:mm:ss");
    };

    this.deleteLogFile = function () {
      var dlfthis = this;
      $timeout(function(){
        $fileLogger.deleteLogfile().then(function () {
          dlfthis.info("The log file " + logFileName + " is deleted!");
        });
      }, 3000);   // Fixed reccommended timeout for file deletion
    };

    //
    // logUpload() gets called during login or from Advance/Upload menu which loads the current existing lofile.
    //

    this.logUpload = function (usernameIn, passwordIn) {
      if (!$rootScope.isAndroid) {
        // Currently $cordovaFileTransfer.upload supports Android only. Hence we bail out. We do support $fileLogger.log
        // The point to note is the logfile is available for other means of retrival later
        $fileLogger.setTimestampFormat("yyyy-MM-ddTHH:mm:ss");
        $rootScope.fileUploaded = true;
        this.error("ERROR: ERROR: LoggingService: Not a Android Device " + "Please contact your friendly CareWheels Customer Support");
        return;
      }

      $rootScope.fileUploaded = false;   // This will ensure the logfile does not get deleted before upload

      // save the reference to this
      var self = this;
      self.info("LoggingService: Running on Android platform");
      var getFullPkg = function () {
        username = usernameIn;
        password = passwordIn;

        // $q is a service that helps you run functions asynchronously, and use their return
        // values (or exceptions) when they are done processing. getFullPkg() gets called first
        // as part of logUpload() and then all the rest functions get called. These functions
        // execute asynchronously, but $q gurantees that the get used in the order listed.
        return $q.resolve(self.getUserInfo());
      } // getFullPkg()

      var getFileURL = function (fullPkg) {
        //
        // If this is not the very first login than a Logfile from from the pervious login will exist
        //
        return $fileLogger.checkFile().then(function (checked) {
          self.info("LoggingService: CheckFile() " + "Passed");
          var fileURL = checked.localURL;
          self.info("LoggingService: CheckFileResponse: " + JSON.stringify(checked));
          self.info("LoggingService: URL: " + fileURL);
          return fileURL;
        }).catch(function(reason) {
          //
          // This means either 1.the file does not exist meaning this is a first login or
          // 2. There is a problem with the file
          //
          if (reason.message == "NOT_FOUND_ERR") { // First login
            self.initLogComponent();    // Sets the correct logfile and also set the correct date format
            self.info("-----New log file was created!"); // This operation will create the lofile.
            self.info(fullPkg); // This will get added to the newly created  logfile
            $rootScope.fileUploaded = true;  // Logfile was not uploaded but we will allow the logfile to be written
          } else {
            self.error("ERROR: LoggingService: CheckFile Failed: " + JSON.stringify(reason));
            self.error("ERROR: Full Package: " + fullPkg); // This will give more info
          }
          throw reason;
        })
      } // getFileURL()

      var upload = function (fileURL) {
        // generate file name for uploading base on current date and time
        var currentDateTime = self.getCurrentDateTime();
        var fileNameUp = username + '-' + currentDateTime + '.log';
        var options = {
          fileKey: "filetoupload",
          fileName: fileNameUp,
          mimeType: "text/plain",
          params: {'username': username, 'password': password, 'fileName': fileNameUp}
        };
        options.headers = {'headerParam': 'headerValue'};
        self.info("LoggingService: UploadFileName: " + fileNameUp);
        var uri = encodeURI(API.loggingServices8080);
        // Second parameter is a URL for the storage file location - fileURL or the file itself - uploadFile
        /*TODO: Later. Please check app.js for details
        var preLoginMsg = window.localStorage['preLogin.log'];
        $fileLogger.log("INFO", preLoginMsg);
        $fileLogger.log("INFO", "******Pre Login Log Messages End******\n");
        window.localStorage.removeItem('preLogin.log');
        */

        return $cordovaFileTransfer.upload(uri, fileURL, options);
      } // upload()

      var cleanUp = function (result) {

        self.info("LoggingService: Inside FileTransfer Upload");
        self.info("SUCCESS: " + JSON.stringify(result.response));
        self.info("Code = " + result.responseCode);
        self.info("Response = " + result.response);
        self.info("Sent = " + result.bytesSent);
        self.info("Done uploading log file!. username: " + usernameIn);

        // delete old log file and create a new one
        self.deleteLogFile();
        self.initLogComponent();
        self.info("-----New log file was created!"); // This operation will create the lofile.
        self.info(fullPkg); // This will get added to the current new logfile not to the one just uploaded now
        $rootScope.fileUploaded = true;   // LogFile has been uploaded and new logfile created
      }

      //
      // All the above functions in logUpload() gets defined and finally $ionicPlatform.ready() gets called.
      // getFullPkg() runs and as the head of the queue as implemented by $q. getFileUrl(), upload(), cleanup()
      // all run asynchronouly in parallel and when all are done $q ensures the values they generate gets used
      // in the proper order
      //

      $ionicPlatform.ready(function () {
        self.info("LoggingService: Ionic Platform is ready");
        getFullPkg()
          .then(getFileURL)
          .then(upload)
          .then(cleanUp)
          .catch(function (error) {                                         // $cordovaFileTransfer.upload()
            self.error("ERROR: Logfile failed to load: " + JSON.stringify(error));
            self.error("ERROR: Code = " + error.code);
            self.error("ERROR: Error source " + error.source);
            self.error("ERROR: Error target " + error.target);
            $rootScope.fileUploaded = true;  // Logfile was not uploaded but we will let the app execute as normal
        });
      }); // $ionicPlatform.ready()


    };  // logUpload()

    //
    // $rootScope.fileUploaded is kept false till the logfile is uploaded. Else as and when the logfile is being
    // uploaded it will get written and than will corrupt the logfile. From the start of the upload function
    // till as such it is loaded nothing should be appended to it.
    //

    var logInternal = function (functionName, args) {
      if (!$rootScope.fileUploaded) {
        console[functionName].apply(console, args);
        // TODO: window.localStorage['preLogin.log'] += args[0] + " \n";   // This will catch the earlier log messages
      } else {
        $fileLogger[functionName].apply($fileLogger, args);
      }
    }

    this.log = function () {
      logInternal('log', arguments);
    }
    this.debug = function () {
      logInternal('debug', arguments);
    }
    this.info = function () {
      logInternal('info', arguments);
    }
    this.warn = function () {
      logInternal('warn', arguments);
    }
    this.error = function () {
      logInternal('error', arguments);
    }
  })
