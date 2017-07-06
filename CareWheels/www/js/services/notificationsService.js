//
// CareWheels Corporation 2016
// Filename: notificationsServices.js
// Description: This takes care of notifying the user on the reminder times for taking meds and meals
//
// Authors: Capstone students PSU Aug 2016
//
//
angular.module('careWheels')
//Notifications Component, as defined in design document. To be used to generate User Reminders and Red Alert tray notifications on Android.
.factory("notifications", function($cordovaLocalNotification, fileloggerService){

  var isAndroid = window.cordova !== undefined;    //checks to see if cordova is available on this platform; platform() erroneously returns 'android' on Chrome Canary so it won't work
  var data;   //needs to be called outside the functions so it persists for all of them

  var notifications = {};


  notifications.getData = function(){
    data = angular.fromJson(window.localStorage['Reminders']); // The produces an object called data
    fileloggerService.info('NotifyServ: Reminder Data: ' + JSON.stringify(data));
    return angular.fromJson(window.localStorage['Reminders']);;
  };

  notifications.Time = function() {
    this.hours=0; this.minutes=0; this.seconds=0; this.on=true;
  };

  //To be called during app startup after login; retrieves saved alert times (if they exist) or creates default alerts (if they don't)
  //and calls Create_Notif for each of them
  notifications.Init_Notifs = function() {
    data = angular.fromJson(window.localStorage['Reminders']);
    fileloggerService.info('NotifyServ: Reminder data: ' + JSON.stringify(data));
    if(data==null){   //have notifications been initialized before?
      data = [];    //data param needs to be initialized before indices can be added
      data[0] = new notifications.Time();
      data[1] = new notifications.Time();
      data[2] = new notifications.Time();
      notifications.Create_Notif(10,0,0,true,1);  //these correspond to the pre-chosen default alarm times
      notifications.Create_Notif(14,0,0,true,2);
      notifications.Create_Notif(19,0,0,true,3);
    } else {    //need to check if each reminder, as any/all of them could be deleted by user
      notifications.Create_Notif(data[0].hours,data[0].minutes,data[0].seconds,data[0].on,1);
      notifications.Create_Notif(data[1].hours,data[1].minutes,data[1].seconds,data[1].on,2);
      notifications.Create_Notif(data[2].hours,data[2].minutes,data[2].seconds,data[2].on,3);
    }
  };

  //Schedules a local notification and, if it is a reminder, saves a record of it to local storage. reminderNum must be <4
  //or it will log an error and schedule no notifications.
  notifications.Create_Notif = function(hours, minutes, seconds, isOn, reminderNum){
    if(reminderNum==0){   //is notif a red alert?
      if(isAndroid){
        $cordovaLocalNotification.schedule({    //omitting 'at' and 'every' params means it occurs once, immediately
          id: reminderNum,
          message: "There are red alert(s) on your CareWheel!",
          title: "CareBank",
          sound: null   //should be updated to freeware sound
        }).then(function() {
          // Nothing for now
        });
      }
    } if(reminderNum>0 && reminderNum <4){    //is notif a user reminder?
      var time = new Date();    //defaults to current date/time
      time.setHours(hours);     //update
      data[reminderNum-1].hours = hours;
      time.setMinutes(minutes);
      data[reminderNum-1].minutes = minutes;
      time.setSeconds(seconds);
      data[reminderNum-1].seconds = seconds;
      data[reminderNum-1].on = isOn;
      window.localStorage['Reminders'] = angular.toJson(data);   //save data so new reminder is stored
      if(isOn){
        if(isAndroid){
              $cordovaLocalNotification.schedule({
                id: reminderNum,
                at: time,
                every: "day",
                text: "Reminder " + reminderNum + ": Please check the status of your CareWheel group using the CareBank application",
                title: "CareBank",
                sound: null   //same, hopefully a different sound than red alerts
              }).then(function() {
                fileloggerService.info("Reminder Notification: " + reminderNum + " has been scheduled for: " + time.toTimeString() + ", daily");
              });
          }
        } else {    //need to deschedule notification if it has been turned off
          if(isAndroid){
            $cordovaLocalNotification.cancel(reminderNum, function() {
              fileloggerService.info("NotifyServ: Reminder Notification: " + reminderNum + " has been descheduled.");
            });
          }
        }
    } else if(reminderNum >=4) {
      fileloggerService.warn("NotifyServ: Incorrect attempt to create notification for id #: " + reminderNum);
    }
  };

  //Unschedules all local reminders; clears its index if it is a user reminder (id 1-3).
  notifications.Delete_Reminders = function(){   //NOTE: id corresponds to data array indices so it is off by one
    if(isAndroid){
      for(i=1; i<4; ++i){
        $cordovaLocalNotification.clear(i, function() {
          fileloggerService.info("NotifyServ: Reminder Notification: " + i + " is cleared");
        });
      }
    }

    window.localStorage['Reminders'] = null;   //and delete Reminders array
    data = null;
  };

  /**
   * returns a reminder (id # = 0,1, or 2) as a string in the format HH:MM:SS
   * @return {string}
   */
  notifications.Reminder_As_String = function(id){
    if(id>2){
      $ionicPopup.alert({
        title: "Reminder notification not set [NS1]",
        subTitle: "Contact support"
      });
      fileloggerService.warn("NotifyServ: Incorrect attempt to create notification for id #: " + reminderNum);
      fileloggerService.error("NotifyServ: Reminder Notification Attempted to print Reminder id: " + id + ", but there are only 3 reminders!");
    } else {
      var hour = data[id].hours;
      if(hour<10) hour = 0 + String(hour);
      var minute = data[id].minutes;
      if(minute<10) minute = 0 + String(minute);
      //var second = data[id].minutes;   //seconds can only be 00 currently
      //if(second<10) second = 0 + String(second);
      return hour + ":" + minute + ":00"; //+ second;
    }
  };
  return notifications;
});
