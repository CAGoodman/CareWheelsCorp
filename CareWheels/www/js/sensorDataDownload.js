//
// CareWheels Corporation 2016
// Filename: sensorDataDownload.js
// Description: CareBank app calls the CareBank Server to download the sensor data to refresh user screen
//
// Authors: Capstone students PSU Aug 2016
// Revision: Changed the URL to point to a particular IP for devlopement - AV 10/27/16
//
//

angular.module('careWheels')
  .factory('Download', function ($http, $httpParamSerializerJQLike, GroupInfo, User, notifications, API) {
    var DownloadService = {};

    //
    // This is the last function called after login as part of download scheduling
    // Currently this gets called from groupStatus.js, IndividualStatus.js when the user pulls for a refresh.
    // This also gets called by Advanced.js when user clicks ScreenRefresh.
    //
    DownloadService.DownloadData = function (finalCallback) {

      var getData = function (member, callback) {

        // initial check for sense keys
        if (member.customValues[1].stringValue == "000" || member.customValues[1].stringValue == "" ||
          member.customValues[2].stringValue == "000" || member.customValues[2].stringValue == "") {
          //theseMembers[i].sensorData = null;
          console.log("error, please obtain valid sen.se keys!");
          return callback();
        }

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

          console.log("Sensor response: ", response);

          GroupInfo.setAnalysisData(usernametofind, response.data);//add new analysis data to group member

          if(response.data.medsAlertLevel >= 2) { //handle red alert notifications
            notifications.Create_Notif(0, 0, 0, false, 0);
            console.log("Meds notification created!");
          }

          if(response.data.fridgeAlertLevel >= 2) {  //handle *red alert* notifications
            notifications.Create_Notif(0, 0, 0, false, 0);
            console.log("Fridge notification created!")
          }

          console.log("Group after downloading sensor data: ", GroupInfo.groupInfo());

        }, function error(response) {
          console.log("request failed ", response);
          //log appropriate error
        }).then(function(){
          // were done with this member
          return callback();
        })
      };

      // main: this will run when download is called

      var theseMembers = GroupInfo.groupInfo();//returns all five group members with carebank data after login

      // run the download sequentially so we know when were done
      getData(theseMembers[0], function(){
        getData(theseMembers[1], function(){
          getData(theseMembers[2], function(){
            getData(theseMembers[3], function(){
              getData(theseMembers[4], function(){
                return finalCallback();
              });
            });
          });
        });
      });



/*      for (var i = 0; i < theseMembers.length; i++) {//this is where we loop over each group member, check for keys, and download data
        theseMembers[i].index = i;
        if (theseMembers[i].customValues[1].stringValue == "000" || theseMembers[i].customValues[1].stringValue == "" ||
          theseMembers[i].customValues[2].stringValue == "000" || theseMembers[i].customValues[2].stringValue == "") {
          //theseMembers[i].sensorData = null;
          console.log("error, please obtain valid sen.se keys!");
        }
        else {
          getData(theseMembers[i]);
        }
      }*/
    };
    return DownloadService;
  });


