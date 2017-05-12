//
// CareWheels Corporation 2016
// Filename: dataDownloadServices.js
// Description: CareBank app calls the CareBank Server to download the sensor data to refresh user screen
//
// Authors: Capstone students PSU Aug 2016
// Revision: Changed the URL to point to a particular IP for devlopement - AV 10/27/16
//
//

angular.module('careWheels')
  .factory('Download', function ($rootScope, $http, $httpParamSerializerJQLike, $q, GroupInfo, User, notifications, API,
    fileloggerService, loginDependencies) {

    var DownloadService = {};
    var dd = [], ddIndex = 0, ddInit = false;   // Variables to help log the download data only if there is a change

    //
    // After the logfile is uploaded this is called to reset. The idea being every logfile shall have  full set of
    // downlaoded files.
    //

    DownloadService.InitddVar = function () {
      ddIndex = 0;
      ddInit = false;
      dd = [];
    }

    //
    // This is the last function called after login as part of download scheduling
    // Currently this gets called from groupStatus.js, IndividualStatus.js when the user pulls for a refresh.
    // This also gets called by Advanced.js when user clicks ScreenRefresh.
    //

    DownloadService.DownloadData = function (finalCallback) {

      //
      // getData() gets defined here and we need to call it for all the members.
      // We want to do it asynchronously i.e., in parallel. Hence we queue it using $q.
      // Scroll all the way down where this getData() gets called.
      //

      var getData = function (member) {
        var usernametofind = member.username; //.toLowerCase();//for each group member
        var user = User.credentials();//from login
        var password = user.password;//credentials of logged in user, from USER service
        var username = user.username;

        //http request to carebank /getfeeds/ endpoint
        return $http({
          url: API.sensorDownLoad,
          method: 'POST',
          data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
            usernametofind: usernametofind,
            username: username,
            password: password
             }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
          }
        }).then(function successCallback(response) {
          User.hidePassword(response, 'DD');

          //
          // Since the downloaded data remains mostly unchanged we prevent logfile filling of repeated data.
          //

          if (!ddInit){   //Initially save away the data to an array
            dd[ddIndex] = response;
            fileloggerService.info("DataDownLoad: " + response.config.data + ": " + JSON.stringify(response));
          } else {    // After the first download all control will come here
            for (i = 0; i < loginDependencies.userCount; i++) {
              if (dd[i].config.data == response.config.data) {  // Check if the user names match
                if (JSON.stringify(dd[i]) != JSON.stringify(response)) {  // Now check if the entire response does not match
                  dd[i] = response;       // It did not match so replace the old with the new data
                  fileloggerService.info("DataDownLoad: " + response.config.data + ": " + JSON.stringify(response)); // Log the new response data
                  break;
                }
              }
            }
          }
          ddIndex++;

          // This initialization ensures as long we don't reset and do not upload logfile we dont log downloading
          // of the same data

          if (ddIndex == loginDependencies.userCount) {   // If we have saved away all users we are done intializing
            ddInit = true;
            ddIndex = 0;
          }

          // **************** BEGIN Debug or Demo code instrumentation**************
          // presenceByHour -> True or false and is 24 element long
          // HitsByHour --> A number which is the count of hits/hour. Can be max of 5/hour
          // FriddeAlertLevel --> Current Alert level. Starts 1(Yellow) then escalates to 2(Red) and further increases by 1
          // MedsAlertLEvel --> Current Alert Level. Starts 2(Red) and increases by 2 never yellow
          // RollingAlertLevel --> Remebers the previous Alert Levels as the day rolls by
          // The max for FridgeAlertLevel = 6 and MedsAlertLevel = 12
          //
          if(usernametofind == "testalice") {
            if ($rootScope.dbgLevel == 1){    // This is for the VC Demo
              for (var i = 0; i < response.data.presenceByHour.length; i++) {
                response.data.presenceByHour[i] = true; // Make it full present for Alert to kick in
              }
              response.data.fridgeHitsByHour[6] = 2;      // 6AM we enter to red alert fridge
              response.data.fridgeAlertLevel = 1;         // current level
              for (var i = 0; i < response.data.fridgeRollingAlertLevel.length; i++) {
                if (i < 13){
                  response.data.fridgeRollingAlertLevel[i] = 0 ;  // Ensure 0 hits till 1AM to push it to yellow alert
                } else {
                  response.data.fridgeRollingAlertLevel[i] = 1 ; // Yellow
                }
              }
              response.data.medsHitsByHour[6] = 1;      // 6AM we enter to red alert meds
              response.data.medsAlertLevel = 2;         // current level
              for (var i = 0; i < response.data.medsRollingAlertLevel.length; i++) {
                 if (i < 13){
                  response.data.medsRollingAlertLevel[i] = 0 ; // Ensure 0 hits till 1AM to push it to red alert
                } else {
                  response.data.medsRollingAlertLevel[i] = 2 ; // Red
                }
              }
            } // dbgLevel = 1
            if ($rootScope.dbgLevel == 2){    // For validating referesh using pull
              var d, h;
              d = new Date();
              h = d.getHours();
              var i1 = Math.floor((Math.random() * h) + 0);
              var i2 = Math.floor((Math.random() * h) + 0);
              var i3 = Math.floor((Math.random() * h) + 0);
              response.data.fridgeHitsByHour[i1] = Math.floor((Math.random() * 5) + 0);
              response.data.fridgeHitsByHour[i2] = Math.floor((Math.random() * 5) + 0);
              response.data.fridgeHitsByHour[i3] = Math.floor((Math.random() * 5) + 0);
              response.data.medsHitsByHour[i1] = Math.floor((Math.random() * 5) + 0);
              response.data.medsHitsByHour[i2] = Math.floor((Math.random() * 5) + 0);
              response.data.medsHitsByHour[i3] = Math.floor((Math.random() * 5) + 0);
              response.data.presenceByHour[i1] = true;
              response.data.presenceByHour[i2] = false;
              response.data.presenceByHour[i3] = true;
              response.data.credit *= i1;
              response.data.debit *= i2;
              response.data.balance *= i3;
            }
          }
          // **************** END Debug or Demo code instrumentation**************

          GroupInfo.setAnalysisData(usernametofind, response.data); //add new analysis data to group member

          if(response.data.medsAlertLevel >= 2) { //handle red alert notifications
            notifications.Create_Notif(0, 0, 0, false, 0);
          }
          if(response.data.fridgeAlertLevel >= 2) {  //handle *red alert* notifications
            notifications.Create_Notif(0, 0, 0, false, 0);
          }

        }, function errorCallback(response) {     // Most common error code is -1 = ERR_NETWORK_IO_SUSPENDED
          User.hidePassword(response, 'DD');
          if (response.statusText === "") { // When net work is down the errorCode = -1 meaning ERR_NETWORK_IO_SUSPENDED
            User.getHttpErrorCode("getData", response);
          }
          fileloggerService.error("DataDownLoad: getData(): Request failed " + JSON.stringify(response));
        })
      };    // getData();

      // main: this will run when download is called

      var theseMembers = GroupInfo.groupInfo(); //returns all five group members with carebank data after login

      //
      // run the download in parallel i.e., asynchrounsly this saves a significant time then running in
      // sequentially. What $q.all does is pass one member after the other to getData(). The map() function
      // takes the member list from theseMembers and feed them the memeber
      //

      $q.all(theseMembers.map(function (member) {
        return getData(member);
      })).then(function(){
        fileloggerService.info("DataDownLoad: getData(): Data download completed!!");
        return finalCallback();
      });
    };
    return DownloadService;
  });
