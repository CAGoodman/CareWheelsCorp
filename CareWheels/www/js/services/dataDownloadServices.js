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
  .factory('Download', function ($rootScope, $http, $httpParamSerializerJQLike, $q, $fileLogger, GroupInfo, User, notifications, API,
    fileloggerService) {
    var DownloadService = {};

    //
    // This is the last function called after login as part of download scheduling
    // Currently this gets called from groupStatus.js, IndividualStatus.js when the user pulls for a refresh.
    // This also gets called by Advanced.js when user clicks ScreenRefresh.
    //
    DownloadService.DownloadData = function (finalCallback) {

      // getData() gets defined here and we need to call it for all the members.
      // We want to do it asynchronously i.e., in parallel. Hence we queue it using $q
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
        // success
        }).then(function (response) {
          var pos = response.config.data.indexOf("&");  //password is removed from display
          fileloggerService.execTrace("Logged in user collecting Sensor Data for: " + response.config.data.slice(pos+1));
          fileloggerService.execTrace("Balance: " + response.data.balance + " Credit: " + response.data.credit +
            " Debit: " + response.data.debit + " FridgeAlertLevel " + response.data.fridgeAlertLevel +
            " MedsAlertLevel: " + response.data.medsAlertLevel + " VacationMode: " + response.data.vacationMode);
          fileloggerService.execTrace("FridgeHitsByHour: " + "[" + response.data.fridgeHitsByHour + "]");
          fileloggerService.execTrace("FridgeRollingAlertLevel: " + "[" + response.data.fridgeRollingAlertLevel + "]");
          fileloggerService.execTrace("MedsHitsByHour: " + "[" + response.data.medsHitsByHour + "]");
          fileloggerService.execTrace("MedsRollingAlertLevel: " + "[" + response.data.medsRollingAlertLevel + "]");
          fileloggerService.execTrace("PresenceByHour: " + "[" + response.data.presenceByHour + "]");
          fileloggerService.execTrace("Status: " + response.status + " StatusText: " + response.statusText);

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

          GroupInfo.setAnalysisData(usernametofind, response.data);//add new analysis data to group member

          if(response.data.medsAlertLevel >= 2) { //handle red alert notifications
            notifications.Create_Notif(0, 0, 0, false, 0);
            fileloggerService.execTrace("DataDownLoad:getData(): Meds notification created!");
          }
          if(response.data.fridgeAlertLevel >= 2) {  //handle *red alert* notifications
            notifications.Create_Notif(0, 0, 0, false, 0);
            fileloggerService.execTrace("DataDownLoad:getData(): Fridge notification created!")
          }

        }, function error(response) {
          $fileLogger.log("ERROR", "DataDownLoad:getData(): Request failed ");
           var pos = response.config.data.indexOf("&");  //password is removed from display
          $fileLogger.log("ERROR", "Logged in user collecting Sensor Data for: " + response.config.data.slice(pos+1));
          $fileLogger.log("ERROR", "Balance: " + response.data.balance + " Credit: " + response.data.credit +
            " Debit: " + response.data.debit + " FridgeAlertLevel " + response.data.fridgeAlertLevel +
            " MedsAlertLevel: " + response.data.medsAlertLevel + " VacationMode: " + response.data.vacationMode);
          $fileLogger.log("ERROR", "FridgeHitsByHour: " + "[" + response.data.fridgeHitsByHour + "]");
          $fileLogger.log("ERROR", "FridgeRollingAlertLevel: " + "[" + response.data.fridgeRollingAlertLevel + "]");
          $fileLogger.log("ERROR", "MedsHitsByHour: " + "[" + response.data.medsHitsByHour + "]");
          $fileLogger.log("ERROR", "MedsRollingAlertLevel: " + "[" + response.data.medsRollingAlertLevel + "]");
          $fileLogger.log("ERROR", "PresenceByHour: " + "[" + response.data.presenceByHour + "]");
          $fileLogger.log("ERROR", "Status: " + response.status + " StatusText: " + response.statusText);
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
        fileloggerService.execTrace("DataDownLoad:getData(): Data download completed!!");
        return finalCallback();
      });
    };
    return DownloadService;
  });
