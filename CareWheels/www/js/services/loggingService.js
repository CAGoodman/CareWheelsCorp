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
      this.info("LogServ: Log file name: " + fileName + " was initialized");
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
      var ilcthis = this;
        ilcthis.setLogLocation(logFileName);
        $fileLogger.setTimestampFormat("yyyy-MM-ddTHH:mm:ss");
    };

    this.deleteLogFile = function () {
      var dlfthis = this;
        $fileLogger.deleteLogfile().then(function () {
          dlfthis.info("LogServ: The log file " + logFileName + " is deleted!");
        });
    };

    //
    // Currently used of for debug purpose only
    //

    this.printLogfile = function() {
        $fileLogger.getLogfile().then(function(l) {
          console.log('********************Logfile content start**********************');
          console.log(l);
          console.log('********************Logfile content end**********************');
        });
    }

    //
    // logUpload() gets called during login or from Advance/Upload menu which loads the current existing lofile.
    //

    this.logUpload = function (usernameIn, passwordIn, callingFunc) {
      $fileLogger.setTimestampFormat("yyyy-MM-ddTHH:mm:ss");
      if (!$rootScope.isAndroid) {

        //
        // Currently $cordovaFileTransfer.upload supports Android only. Hence we bail out. We do support $fileLogger.log
        // The point to note is the logfile is available for other means of retrival later

        $rootScope.fileUploaded = true;
        $ionicPopup.alert({
          title: "This is not a Android device. " + usernameIn + " please note no logfile will be created",
          subTitle: "Please contact your friendly CareBank customer support for help"
        });
        this.error("LogServ: ERROR: Not a Android Device " + "Please contact your friendly CareWheels Customer Support");
        $rootScope.$emit('logfileCreated', 'Not a Android system so Logfile will not be created');
        return;
      }

      $rootScope.fileUploaded = false;   // This will ensure the logfile does not get deleted before upload

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
        return $q.resolve(self.getUserInfo());
      } // getFullPkg()

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
            self.initLogComponent();    // Sets the correct logfile and also set the correct date format
              $rootScope.fileUploaded = true;  // Logfile was not uploaded but we will allow the logfile to be written
              self.info("LogServ: " + fullPkg); // This will get added to the newly created  logfile
              self.info("LogServ: New log file was created!"); // This operation will create the lofile.
          } else {
            self.error("LogServ: ERROR: CheckFile Failed: " + JSON.stringify(reason));
            self.error("LogServ: ERROR: Full Package: " + fullPkg); // This will give more info
            self.error("LogServ: ERROR: *********LOGFILE WAS NOT CREATED!!!!***********");
          }
          //self.printLogfile();
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

        // delete old log file and create a new one
        self.deleteLogFile();
        self.initLogComponent();

          $rootScope.fileUploaded = true;   // LogFile has been uploaded and new logfile created
            self.info(fullPkg); // This will get added to the current new logfile not to the one just uploaded now
          self.info("LogServ: New log file was created!"); // This operation will create the lofile
          var preLoginMsg = window.localStorage['preLogin.log']; //Read the saved messages
          self.info(preLoginMsg); // Write it to the new log file at the top
          self.info("LogServ: ******Pre Login Log Messages End******\n");

        window.localStorage.removeItem('preLogin.log'); // Delete the preLogin.log file
        window.localStorage['preLogin.log'] = "\nLogServ: ******Pre Login Log Messages Begin****** \n\n"; // Create a new one
        //self.printLogfile();
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
          .then(getFileURL)
          .then(upload)
          .then(cleanUp)
          .catch(function (error) {                                         // $cordovaFileTransfer.upload()
            self.error("LogServ: ERROR: Logfile failed to load: " + JSON.stringify(error));
            self.error("LogServ: ERROR: Code = " + error.code);
            self.error("LogServ: ERROR: Error source " + error.source);
            self.error("LogServ: ERROR: Error target " + error.target);
            $rootScope.fileUploaded = true;  // Logfile was not uploaded but we will let the app execute as normal
        });
      }); // $ionicPlatform.ready()
      if (callingFunc === 'login') $rootScope.$emit('logfileCreated', 'Logfile created and probably uploaded too');
    };  // logUpload()

    //
    // $rootScope.fileUploaded is kept false till the logfile is uploaded. Else as and when the logfile is being
    // uploaded it will get written and than will corrupt the logfile. From the start of the upload function
    // till as such it is loaded nothing should be appended to it.
    //

    var logInternal = function (functionName, args) {
      if (!passMessage(args, "")) return;
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

    var passMessage = function (args, msg){
      if (!args) return false;
      if (msg == "") return true;
      if (args[0].indexOf(msg) == 0) return true;
      return false;
    }
  })

