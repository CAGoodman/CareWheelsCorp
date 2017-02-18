/*++
 CareWheels Corporation 2016
 Filename: groupInfoServices.js
 Description: Group Info Services

 Authors: Capstone students PSU Aug 2016
 Revision: Vacation mode and blance have been fixed: NXB/AV - 01/12/
 groupStatus interacts with the html interface exposed to the user
 poor groupInfoServices() does the real work
--*/

// GroupInfo factory for global GroupInfo
angular.module('careWheels')
.factory('GroupInfo', function ($fileLogger, fileloggerService) {
  var groupInfoService = {};
  var groupInfo = [];
  var memberSelected;
    var groupArray = [];
  var sensorError = false;

    var CUSTOMFIELD_TYPE = {
      BOOLEAN: "booleanValue",
      STRING: "stringValue"
    }

    var CUSTOMFIELD = {

      ACCESS_TOKEN: { name: "accessToken", type: CUSTOMFIELD_TYPE.STRING },
      REFRESH_TOKEN: { name: "refreshToken", type: CUSTOMFIELD_TYPE.STRING },
      REMINDER_1: { name: "reminder1", type: CUSTOMFIELD_TYPE.STRING },
      REMINDER_2: { name: "reminder2", type: CUSTOMFIELD_TYPE.STRING },
      REMINDER_3: { name: "reminder3", type: CUSTOMFIELD_TYPE.STRING },
      SENSE_USERNAME: { name: "SenseUsername", type: CUSTOMFIELD_TYPE.STRING },
      MEDS_INTERVAL_2: { name: "medsInterval2", type: CUSTOMFIELD_TYPE.BOOLEAN },
      MEDS_INTERVAL_3: { name: "medsInterval3", type: CUSTOMFIELD_TYPE.BOOLEAN },
      MEDS_INTERVAL_4: { name: "medsInterval4", type: CUSTOMFIELD_TYPE.BOOLEAN },
      ON_VACATION: { name: "onVacation", type: CUSTOMFIELD_TYPE.BOOLEAN }

    };

    groupInfoService.getCustomFieldValue = function (groupMemberObject, customField) {

      if(groupMemberObject.customValues == null) {
        return null;
      }

      for(var i = 0; i < groupMemberObject.customValues.length; i++) {

        if (groupMemberObject.customValues[i].field.internalName == customField.name) {

          if(customField.type == CUSTOMFIELD_TYPE.BOOLEAN) {

            return groupMemberObject.customValues[i].booleanValue;
          }

          if(customField.type == CUSTOMFIELD_TYPE.STRING) {

            return groupMemberObject.customValues[i].stringValue;
          }
        }
      }

      return null;
    };

    groupInfoService.setCustomFieldValue = function (groupMemberObject, customField, newValue) {

      if(groupMemberObject.customValues == null) {
        return null;
      }

      for(var i = 0; i < groupMemberObject.customValues.length; i++) {

        if (groupMemberObject.customValues[i].field.internalName == customField.name) {

          if(customField.type == CUSTOMFIELD_TYPE.BOOLEAN) {

            groupMemberObject.customValues[i].booleanValue = newValue;
          }

          if(customField.type == CUSTOMFIELD_TYPE.STRING) {

            return groupMemberObject.customValues[i].stringValue = newValue;
          }

          return groupMemberObject;
        }
      }

      return null;
    };

    groupInfoService.getUsername = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var username = memberObject.username;

      return username;
    };

    groupInfoService.getName = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var name = memberObject.name;

      return name;
    };

    groupInfoService.getPhoneNumber = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var phoneNumber = memberObject.phoneNumber;

      return phoneNumber;
    };

    groupInfoService.getEmail = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var email = memberObject.email;

      return email;
    };

    groupInfoService.getPhotoUrl = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var photoUrl = memberObject.photoUrl;

      return photoUrl;
    };

    groupInfoService.getBalance = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var balance = memberObject.balance;

      return balance;
    };

    groupInfoService.setBalance = function(username, newValue) {
      var memberObject = groupInfoService.getMember(username);
      memberObject.balance = newValue;
      groupInfoService.setMember(memberObject);

      return memberObject;
    };

    groupInfoService.getSensorData = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var sensorData = memberObject.sensorData;

      return sensorData;
    };

    groupInfoService.setSensorData = function(username, newValue) {
      var memberObject = groupInfoService.getMember(username);
      memberObject.sensorData = newValue;
      groupInfoService.setMember(memberObject);

      return memberObject;
    };

    groupInfoService.getAnalysisData = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var analysisData = memberObject.analysisData;

      return analysisData;
    };

    groupInfoService.setAnalysisData = function(username, newValue) {
      var memberObject = groupInfoService.getMember(username);
      memberObject.analysisData = newValue;
      groupInfoService.setMember(memberObject);

      return memberObject;
    };

    groupInfoService.getAccessToken = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var accessToken = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.ACCESS_TOKEN);

      return accessToken;
    };

    groupInfoService.getRefreshToken = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var refreshToken = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.REFRESH_TOKEN);

      return refreshToken;
    };

    groupInfoService.getReminder1 = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var reminder1 = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.REMINDER_1);

      return reminder1;
    };

    groupInfoService.setReminder1 = function(username, newValue) {
      var memberObject = groupInfoService.getMember(username);
      memberObject = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.REMINDER_1, newValue);
      groupInfoService.setMember(memberObject);

      return memberObject;
    };

    groupInfoService.getReminder2 = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var reminder2 = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.REMINDER_2);

      return reminder2;
    };

    groupInfoService.setReminder2 = function(username, newValue) {
      var memberObject = groupInfoService.getMember(username);
      memberObject = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.REMINDER_2, newValue);
      groupInfoService.setMember(memberObject);

      return memberObject;
    };

    groupInfoService.getReminder3 = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var reminder3 = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.REMINDER_3);

      return reminder3;
    };

    groupInfoService.setReminder3 = function(username, newValue) {
      var memberObject = groupInfoService.getMember(username);
      memberObject = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.REMINDER_3, newValue);
      groupInfoService.setMember(memberObject);

      return memberObject;
    };

    groupInfoService.getSenseUsername = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var senseUsername = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.SENSE_USERNAME);

      return senseUsername;
    };

    groupInfoService.getMedsInterval2 = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var medsInterval2 = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.MEDS_INTERVAL_2);

      return medsInterval2;
    };

    groupInfoService.setMedsInterval2 = function(username, newValue) {
      var memberObject = groupInfoService.getMember(username);
      memberObject = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.MEDS_INTERVAL_2, newValue);

      return memberObject;
    };

    groupInfoService.getMedsInterval3 = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var medsInterval3 = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.MEDS_INTERVAL_3);

      return medsInterval3;
    };

    groupInfoService.setMedsInterval3 = function(username, newValue) {
      var memberObject = groupInfoService.getMember(username);
      memberObject = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.MEDS_INTERVAL_3, newValue);

      return memberObject;
    };

    groupInfoService.getMedsInterval4 = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var medsInterval4 = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.MEDS_INTERVAL_4);

      return medsInterval4;
    };

    groupInfoService.setMedsInterval4 = function(username, newValue) {
      var memberObject = groupInfoService.getMember(username);
      memberObject = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.MEDS_INTERVAL_4, newValue);

      return memberObject;
    };

    groupInfoService.getOnVacation = function(username) {
      var memberObject = groupInfoService.getMember(username);
      var OnVacation = groupInfoService.getCustomFieldValue(memberObject, CUSTOMFIELD.ON_VACATION);

      return OnVacation;
    };

    groupInfoService.createGroupMember = function(groupMemberObject) {

      // New object that we should move our code towards instead of modifying the
      // returned cyclos data object directly.
      var groupMember = {

        username: groupMemberObject.username,
        name: groupMemberObject.name,
        phoneNumber: groupMemberObject. phoneNumber,
        email: groupMemberObject. email,
        onVacation: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.ON_VACATION),
        photoUrl: groupMemberObject.photoUrl,
        balance: groupMemberObject.balance,
        reminder1: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.REMINDER_1),
        reminder2: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.REMINDER_2),
        reminder3: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.REMINDER_3),
        medsInterval2: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.MEDS_INTERVAL_2),
        medsInterval3: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.MEDS_INTERVAL_3),
        medsInterval4: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.MEDS_INTERVAL_4),
        accessToken: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.ACCESS_TOKEN),
        refreshToken: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.REFRESH_TOKEN),
        senseUsername: groupInfoService.getCustomFieldValue(groupMemberObject, CUSTOMFIELD.SENSE_USERNAME),
        sensorData: null,
        analyzsisData: null
      };

      return groupMember;
    };

    groupInfoService.createGroup = function (cyclosGroupDataArray) {

      var groupMembers = [];

      for(var i = 0; i < cyclosGroupDataArray.length; i++) {
        groupMembers[i] = groupInfoService.createGroupMember(cyclosGroupDataArray[i]);
      }

      return groupMembers;
    };


    groupInfoService.setSensorError = function(boolean){
    sensorError = boolean;
  };

    groupInfoService.getSensorError = function(){
    return sensorError;
  };

  groupInfoService.initGroupInfo = function (data) {

    groupArray = groupInfoService.createGroup(data)

    return groupInfo = data;
  };

  //this function is used at the end of Data Download and Data Analysis
  //it will replace each group members position in the groupInfo array with a newly updated member containing
  //a sensorData object (after Data Download), or a sensorAnalysis object (after Data Analysis)
  groupInfoService.addDataToGroup = function (member, index) {
    groupInfo[index] = member;
  };

  //this function will return the current contents of groupinfo.
  //will be called at the beginning of Data Download, Data Analysis, and group / ind. member summary
  groupInfoService.groupInfo = function () {
    return groupInfo;
  };

  groupInfoService.getSelectedMemberIndex = function () {
    return groupInfo[memberSelected];
  };

  groupInfoService.setSelectedMemberIndex = function (Username) {
    for (var i = 0; i < groupInfo.length; i++) {
      if (groupInfo[i].username == Username)
        memberSelected = i;
    }
    return true;
  };


  groupInfoService.getMember = function (Username) {       // Returns the groupInfo member array index object that contains the same username as the username parameter.
    for (i = 0; i < groupInfo.length; ++i) {
      if (groupInfo[i].username == Username) {
        fileloggerService.execTrace("GetMember(): Found " + Username + "==" + groupInfo[i].username);
        return groupInfo[i];
      }

    }

    $fileLogger.log("error", "GetMember(): Could not find username " + Username);
  };

  groupInfoService.setMember = function (groupInfoMember) {     // Sets the groupInfo array index that contains the same username as the username parameter to the value of the groupInfoMember paramemter.
    for (i = 0; i < 5; ++i) {
      if (groupInfo[i].username == groupInfoMember.username) {
        groupInfo[i] = groupInfoMember;
        return true;
      }

    }

    $fileLogger.log("error", "SetMember(): Could not find username " + Username);
    return false;
  };

  return groupInfoService;

});
