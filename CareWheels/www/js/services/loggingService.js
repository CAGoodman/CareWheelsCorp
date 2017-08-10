/*++
 CareWheels Corporation 2016
 Filename: loggingService.js
 Description: To provide logging services.

 Authors: Capstone students PSU Aug 2016
 Revision: Changed the URL to point to a particular IP for devlopement - AV 10/27/16
 Rewrote the whole file almost as it had many timing and otherissues. - NB & AV 05/03/2017
--*/

angular.module('careWheels.fileloggermodule', ['ionic', 'fileLogger'])
  .service('fileloggerService', function ($rootScope, $timeout, $interval, $q, $fileLogger, $filter, $ionicPlatform,
    $ionicPopup, $cordovaFileTransfer,  $cordovaAppVersion, API, apkDependencies) {

    var logFileName = "careWheelsLogFile.log";
    var username, password;
    var fullPkg, apkPkg;
    $fileLogger.setTimestampFormat("yyyy-MM-ddTHH:mm:ss");

   //checks to see if cordova is available on this platform;
    $rootScope.isAndroid = window.cordova !== undefined;

    this.getCurrentDateTime = function () {
      var today = new Date();
      return $filter('date')(today, 'yyyy-MM-dd-HH-mm-ss');
    };

    this.getApkPkg = function () {
      return $q.all([
        $cordovaAppVersion.getAppName(),
        $cordovaAppVersion.getVersionNumber(),
        $cordovaAppVersion.getVersionCode(),
        $cordovaAppVersion.getPackageName()
      ]).then(function (appInfo) {
        apkPkg = appInfo[0] + ', Version ' + appInfo[1] + ', Build: ' + appInfo[2] + ', ID: ' + appInfo[3] + '\n';
        return apkPkg;
      })
    } // getApkPkg()

    //
    // logUpload() gets called during login or from Advance/Upload menu which loads the current existing lofile.
    //

    this.logUpload = function (usernameIn, passwordIn, callingDrv) {
      if (!$rootScope.isAndroid) {
        //
        // Currently $cordovaFileTransfer.upload supports Android only. Hence we bail out. We do support $fileLogger.log
        // The point to note is the logfile is available for other means of retrival later
        $rootScope.fileUploaded = true; // This is not a Android platform so we will allow the file log to continue
        $ionicPopup.alert({
          title: "Not an Android device. Logfile not created [LS1]",
          subTitle: "Contact support"
        });
        this.error("LogServ: ERROR: Not a Android Device. Contact support");
        return;
      }

      $rootScope.fileUploaded = false;   // This has been already set in app.js and login.js this is just as an insurance
      // save the reference to this
      var self = this;
      self.info("LogServ: Running on Android platform");

      var getFullPkg = function () {
        username = usernameIn;
        password = passwordIn;

        // $q is a service that helps you run functions asynchronously, and use their return
        // values (or exceptions) when they are done processing. getFullPkg() gets called first
        // as part of logUpload() and then all the rest functions get called. These functions
        // execute asynchronously, but $q gurantees that the get used in the order listed.
        return $q.resolve(self.getApkPkg());
      } // getFullPkg()

      // gets all possible info of the hardware, software and executing context to help in debug
      var getUserInfo = function () {
        var headerPkg   = "Logfile Header For User: " + username + "\n"
        var cordovaPkg  = "Cordova Version: " + window.device.cordova + "\n";
        var datePkg     = "APK Date: " + apkDependencies.apkDate + "\n";
        var osPkg       = "OS: " + window.device.platform + " Version: " + window.device.version + "\n";
        var hardwarePkg = "Model and Manufacturer: " + window.device.model + " " + window.device.manufacturer + "\n";
        var IDPkg       = "Serial Number: " + window.device.serial + " UUID: " + window.device.uuid + "\n";
        fullPkg = headerPkg + cordovaPkg + apkPkg + datePkg + osPkg + hardwarePkg + IDPkg;
        return fullPkg;
      };

      var getFileURL = function (fullPkg) {
        //
        // If this is not the very first login than a Logfile from from the pervious login will exist
        //
        return $fileLogger.checkFile().then(function (checked) {
          self.info("LogServ: CheckFile() " + "Passed");
          var fileURL = checked.localURL;
          self.info("LogServ: CheckFileResponse: " + JSON.stringify(checked));
          self.info("LogServ: URL: " + fileURL);
          return fileURL;
        }).catch(function(reason) {
          //
          // This means either 1.the file does not exist meaning this is a first login or
          // 2. There is a problem with the file
          //
          if (reason.message == "NOT_FOUND_ERR") { // First login
            $fileLogger.setStorageFilename(logFileName);  // Sets the correct logfile and also set the correct date format
            $rootScope.fileUploaded = true;  // Logfile was not uploaded but we will allow the logfile to be written
            self.info(fullPkg); // This will get added to the newly created  logfile
            self.info("LogServ: New log file was created!"); // This operation will create the lofile.
            preLoginUpload();
          } else {
            self.error("LogServ: ERROR: CheckFile Failed: " + JSON.stringify(reason));
            self.error("LogServ: ERROR: Full Package: " + fullPkg); // This will give more info
            self.error("LogServ: ERROR: *********LOGFILE WAS NOT CREATED!!!!***********");
          }
          throw reason;   // This is caught by the catch below, uplod() does not get called.
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
		  chunkedMode: false,
          params: {'username': username, 'password': password, 'fileName': fileNameUp}
        };
        options.headers = {'headerParam': 'headerValue'};
        self.info("LogServ: UploadFileName: " + fileNameUp);
        var uri = encodeURI(API.loggingServices8080);
        // Second parameter is a URL for the storage file location - fileURL or the file itself - uploadFile
        return $cordovaFileTransfer.upload(uri, fileURL, options);
      } // upload()

      var cleanUp = function (result) {

        self.info("LogServ: Inside FileTransfer Upload");
        self.info("LogServ: SUCCESS: " + JSON.stringify(result.response));
        self.info("LogServ: Code = " + result.responseCode);
        self.info("LogServ: Response = " + result.response);
        self.info("LogServ: Sent = " + result.bytesSent);
        self.info("LogServ: Done uploading log file!. username: " + usernameIn);
        if (callingDrv == "advanced") {
            $ionicPopup.alert({
              title: "Logfile uploaded to server [LS2]",
              subTitle: "Contact support if you have concerns"
            });
        }
        self.info("LogServ:Logfile has been uploaded");

        // delete old log file and create a new one
        $fileLogger.deleteLogfile().then(function() {
          /*
          $fileLogger.setStorageFilename("messages.log"); // set it to default messages.log
          $fileLogger.deleteLogfile()       // delete messages.log. We dont use it so just want it gone
          $fileLogger.setStorageFilename(logFileName); // This will point it back to careWheelsLogFile.log
          */
          $rootScope.fileUploaded = true;   // LogFile has been uploaded and new logfile created allow the new logfile to log
          self.info(fullPkg); // This will get added to the current new logfile not to the one just uploaded now
          self.info("LogServ: New log file was created!"); // This operation will create the lofile
          preLoginUpload();
        });
      }

      var preLoginUpload = function() {
        var preLoginMsg = window.localStorage['preLogin.log']; //Read the saved messages
        self.info(preLoginMsg); // Write it to the new log file at the top
        self.info("LogServ: ******Pre Login Log Messages End******\n");
        window.localStorage.removeItem('preLogin.log'); // Delete the preLogin.log file
        window.localStorage['preLogin.log'] = "\nLogServ: ******Pre Login Log Messages Begin****** \n\n"; // Create a new one
      }

      //
      // All the above functions in logUpload() gets defined and finally $ionicPlatform.ready() gets called.
      // getFullPkg() runs and as the head of the queue as implemented by $q. getFileUrl(), upload(), cleanup()
      // all run asynchronouly in parallel and when all are done $q ensures the values they generate gets used
      // in the proper order
      //

      $ionicPlatform.ready(function () {
        self.info("LogServ: Ionic Platform is ready");
        getFullPkg()
          .then(getUserInfo)
          .then(getFileURL)
          .then(upload)
          .then(cleanUp)
          .catch(function (error) {                                         // $cordovaFileTransfer.upload()
            self.error("LogServ: ERROR: Logfile failed to load: " + JSON.stringify(error));
            self.error("LogServ: ERROR: Code = " + error.code);
            self.error("LogServ: ERROR: Error source " + error.source);
            self.error("LogServ: ERROR: Error target " + error.target);
            if (callingDrv == "advanced") {
              $ionicPopup.alert({
              title: "Logfile uploaded to server [LS3]",
              subTitle: "Contact support if you have concerns"
              });
            }
            self.error("LogServ: ERROR: Logfile failed to upload");
          });
      }); // $ionicPlatform.ready()
    };  // logUpload()

    //
    // $rootScope.fileUploaded is kept false till the logfile is uploaded. Else as and when the logfile is being
    // uploaded it will get written and than will corrupt the logfile. From the start of the upload function
    // till as such it is loaded nothing should be appended to it.
    //

    var logInternal = function (functionName, args) {
      if (!passMessage(args, "")) return;             // Allows messages with args value to pass blocks the rest
      if (!$rootScope.fileUploaded) {
        var time = new Date();
        args[0] = time.toLocaleString() + ": " + args[0];
        console[functionName].apply(console, args);
        window.localStorage['preLogin.log'] += args[0] + " \n";   // This will catch the earlier log messages
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

    // During debug this acts as a filter and allows only message which have args stirng in them
    // The string in msg is manually typed by the developer and apk rebuilt.
    var passMessage = function (args, msg){
      if (!args) return false;
      if (msg == "") return true;
      if (args[0].indexOf(msg) == 0) return true;
      return false;
    }
  })

