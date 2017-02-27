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
  .factory('Download', function ($http, $httpParamSerializerJQLike, $q, GroupInfo, User, notifications, API,
    $fileLogger, fileloggerService) {
    var DownloadService = {};

    //
    // This is the last function called after login as part of download scheduling
    // Currently this gets called from groupStatus.js, IndividualStatus.js when the user pulls for a refresh.
    // This also gets called by Advanced.js when user clicks ScreenRefresh.
    //
    DownloadService.DownloadData = function (finalCallback) {

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
          fileloggerService.execTrace("Logged in user collecting Sensor Data for: " + response.config.data );
          fileloggerService.execTrace("Balance: " + response.data.balance + " Credit: " + response.data.credit +
            " Debit: " + response.data.debit + " FridgeAlertLevel " + response.data.fridgeAlertLevel +
            " MedsAlertLevel: " + response.data.medsAlertLevel + " VacationMode: " + response.data.vacationMode);
          fileloggerService.execTrace("FridgeHitsByHour: " + "[" + response.data.fridgeHitsByHour + "]");
          fileloggerService.execTrace("FridgeRollingAlertLevel: " + "[" + response.data.fridgeRollingAlertLevel + "]");
          fileloggerService.execTrace("MedsHitsByHour: " + "[" + response.data.medsHitsByHour + "]");
          fileloggerService.execTrace("MedsRollingAlertLevel: " + "[" + response.data.medsRollingAlertLevel + "]");
          fileloggerService.execTrace("PresenceByHour: " + "[" + response.data.presenceByHour + "]");
          fileloggerService.execTrace("Status: " + response.status + " StatusText: " + response.statusText);
/* bugbug
          if(usernametofind == "testalice"){
            var d, h;
            d = new Date();
            h = d.getHours();
            var i1 = Math.floor((Math.random() * h) + 0);
            var i2 = Math.floor((Math.random() * h) + 0);
            var i3 = Math.floor((Math.random() * h) + 0);
            response.data.fridgeHitsByHour[i1] = 1;
            response.data.fridgeHitsByHour[i2] = 2;
            response.data.fridgeHitsByHour[i3] = 3;
            response.data.credit *= i1;
            response.data.debit *= i2;
            response.data.balance *= i3;
            fileloggerService.execTrace("Indices are:" + i1 + " " + i2 + " " + i3);
          }
*/
          GroupInfo.setAnalysisData(usernametofind, response.data);//add new analysis data to group member

          if(response.data.medsAlertLevel >= 2) { //handle red alert notifications
            notifications.Create_Notif(0, 0, 0, false, 0);
            fileloggerService.execTrace("Meds notification created!");
          }
          if(response.data.fridgeAlertLevel >= 2) {  //handle *red alert* notifications
            notifications.Create_Notif(0, 0, 0, false, 0);
            fileloggerService.execTrace("Fridge notification created!")
          }

        }, function error(response) {
          $fileLogger.log("error","request failed ", response);
        })
      };

      // main: this will run when download is called

      var theseMembers = GroupInfo.groupInfo();//returns all five group members with carebank data after login

      // run the download sequentially so we know when were done
      $q.all(theseMembers.map(function (member) {
        return getData(member);
      })).then(function(){
        fileloggerService.execTrace("Data download completed!!");
        return finalCallback();
      });
    };
    return DownloadService;
  });
