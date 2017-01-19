/* eslint-env angular */
/*++
 CareWheels Corporation 2016
 Filename: resetcontrollers.js
 Description: All resets happen here and login errors are generated here.

 Authors: Capstone students PSU Aug 2016
 Revision:

--*/

//Call to the UserInfo custom rest endpoint, which logs user in and then returns all the field data of another user as $scope.data;
//or one of the following error messages: "Missing username / password", "Invalid username / password", "Your access is blocked by
//exceeding invalid login attempts", or a default catch "Error while performing login: errorCode".
angular.module('careWheels')

.controller("UserRestController", function($scope, $http, $log, $httpParamSerializerJQLike){
  $scope.url = 'https://carebank.carewheels.org:8443/userinfo.php';
  $scope.fetch = function(userIn, passIn, tofindIn) {
    $scope.code = null;
    $scope.response = null;
    $http({
      url:$scope.url,
      method:'POST',    //all our custom REST endpoints have been designed to use POST
      data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
        username:userIn,
        password:passIn,
        usernametofind:tofindIn
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
      }
    }).then(function(response) {    //the old $http success/error methods have been depricated; this is the new format
        $scope.status = response.status;
        $scope.data = response.data;
      }, function(response) {
        $scope.data = response.data || "Request failed";
        $scope.status = response.status;
        if(response.status!=200){
          $log.warn($scope.data);
        }
    })
  };

  // function for retrieving a custom field value from the json object returned by the userInfo endpoint. If the custom
  // value cannot be found, returns null.
  getCustomField = function(customFieldName, data) {
    for(var i = 0; i < data.customValues.length; i++) {
      if (data.customValues[i].field.internalName == customFieldName)
        return data.customValues[i].stringValue;
    }
    return null;
  }

  // function will get the lastOwnershipTakenTime value for a specified user.
  $scope.getLastOwnershipTimeForUser = function(userIn, passIn, toFindIn) {
    $scope.response = null;
    $http({
      url:$scope.url,
      method: 'POST',
      data: $httpParamSerializerJQLike({
        username:userIn,
        password:passIn,
        usernametofind:toFindIn
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(function(response) {
      $scope.status = response.status;
      $scope.lastOwnershipTime = getCustomField("LastOwnershipTakenTime", response.data);
    }, function(response) {
      $scope.status = response.status;
      $scope.lastOwnershipTime = "0000/00/00 00:00:00";
      $log.warn(response.data);
    })
  };


/*** Test functions for userInfo.php enpoint ***/

  //test verifies returned json contains expected values using a correct username and password combination
  $scope.testValidUserPass = function() {
    $scope.response = null;
    var userIn = 'b_test_1';
    var passIn = 'password';
    var usernametofindIn = 'b_test_1';
    $http({
      url:$scope.url,
      method: 'POST',
      data: $httpParamSerializerJQLike({
        username:userIn,
        password:passIn,
        usernametofind:usernametofindIn
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(function(response) {
      $scope.status = response.status;
      $scope.pass = ($scope.status == 200);
    }, function(response){

    })
  };

})

//Call to the UpdateUserReminders endpoint, which logs a user in and updates all three of a user's (does not have to be the same user)
//reminder slots in the format HH:MM:SS. Returns same login errors as UserRestController. The contents of a reminder slot
//are cleared by passing in '' rather than a string of the correct format.
.controller("ReminderRestController", function($scope, $http, $log, $httpParamSerializerJQLike){
  $scope.url = 'https://carebank.carewheels.org:8443/updateuserreminders.php';
  $scope.fetch = function(userIn, passIn, toUpdate, rem1, rem2, rem3) {
    $scope.code = null;
    $scope.response = null;
    $http({
      url:$scope.url,
      method:'POST',    //all our custom REST endpoints have been designed to use POST
      data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
        username:userIn,
        password:passIn,
        usernametoupdate:toUpdate,
        reminder1:rem1,
        reminder2:rem2,
        reminder3:rem3
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
      }
    }).then(function(response) {    //the old $http success/error methods have been depricated; this is the new format
        $scope.status = response.status;
        $scope.data = response.data;
      }, function(response) {
        $scope.data = response.data || "Request failed";
        $scope.status = response.status;
        if(response.status!=200){
          $log.warn($scope.data);
        }
    })
  };
})

//Call to the Group Member Info custom rest endpoint
.controller("GroupRestController", function($scope, $http, $log, $httpParamSerializerJQLike){
  $scope.url = 'https://carebank.carewheels.org:8443/groupmemberinfo.php';
  $scope.fetch = function(userIn, passIn, groupName) {
    $scope.code = null;
    $scope.response = null;
    $http({
      url:$scope.url,
      method:'POST',    //all our custom REST endpoints have been designed to use POST
      data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
        username:userIn,
        password:passIn,
        groupInternalName:groupName
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
      }
    }).then(function(response) {    //the old $http success/error methods have been depricated; this is the new format
        $scope.status = response.status;
        $scope.data = response.data;
      }, function(response) {
        $scope.data = response.data || "Request failed";
        $scope.status = response.status;
        if(response.status!=200){
          $log.warn($scope.data);
        }
    })
  };
})

//Call to the UpdateLastOwnershipTakenTime endpoint, which logs a user in and updates the LastOwnershipTakenTime field for
//the member has an alert. This field uses the format XXXX/XX/XX XX:XX:XX. This will report the following error messages upon
//failure: "Missing username / password", "Invalid username / password", "Your access is blocked by exceeding invalid login
//attempts", or a default catch "Error while performing login: errorCode".

// Nothing seems to verify whether or not this is working. I don't know what more can be done.
.controller("OwnershipRestController", function($scope, $http, $log, $httpParamSerializerJQLike){
  $scope.url = 'https://carebank.carewheels.org:8443/updatelastownershiptakentime.php';
  $scope.fetch = function(userIn, passIn, toUpdate, ownershipTime) {
    $scope.code = null;
    $scope.response = null;
    $http({
      url:$scope.url,
      method:'POST',    //all our custom REST endpoints have been designed to use POST
      data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
        username:userIn,
        password:passIn,
        usernametoupdate:toUpdate,
        lastownershiptakentime:ownershipTime,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
      }
    }).then(function(response) {    //the old $http success/error methods have been depricated; this is the new format
        $scope.status = response.status;
        $scope.data = response.data;
      }, function(response) {
        $scope.data = response.data || "Request failed";
        $scope.status = response.status;
        if(response.status!=200){
          $log.warn($scope.data);
        }
    })
  };

/*** Test Functions for UpdateLastOwnershipTakenTime enpoint ***/

  //Verifies the returned json contains updated lastownershiptakentime value sent in the request.
  $scope.test = function() {
    var userIn = "b_test_1";
    var passIn = "password";
    $scope.code = null;
    $scope.response = null;
    $scope.ownershipTime = "2016/07/09 15:30:00";
    $http({
      url:$scope.url,
      method:'POST',
      data:$httpParamSerializerJQLike({
        username:userIn,
        password:passIn,
        usernametoupdate:userIn,
        lastownershiptakentime:$scope.ownershipTime,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(function(response) {
      $scope.status = response.status;
      $scope.data = response.data;
      $scope.value = response.data.customValues[6].stringValue;
      $scope.pass = ($scope.value === $scope.ownershipTime);
    }, function(response) {
      $scope.data = response.data || "Request failed";
      $scope.status = response.status;
    })
  };

  // verifies request returned error 'Invalid username / password'
  $scope.test_passError = function() {
    var userIn = "b_test_1";
    var passIn = "passwor";
    $scope.code = null;
    $scope.response = null;
    $scope.ownershipTime = "2016/07/10 13:50:00";
    $http({
      url:$scope.url,
      method: 'POST',
      data:$httpParamSerializerJQLike({
        username:userIn,
        password:passIn,
        usernametoupdate:userIn,
        lastownershiptakentime:$scope.ownershipTime,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(function(response) {
      $scope.status = response.status;
    }, function(response) {
      $scope.error = response.data || "Request failed";
      $scope.status = response.status;
      $scope.pass = ($scope.error == "Invalid username / password");
    })
  };

  // verifies response for a lastownershiptakentime value of empty string.
  $scope.test_blankTime = function() {
    var userIn = "b_test_1";
    var passIn = "password";
    var ownershipTime = "";
    $http({
      url:$scope.url,
      method: 'POST',
      data:$httpParamSerializerJQLike({
        username:userIn,
        password:passIn,
        usernametoupdate:userIn,
        lastownershiptakentime:ownershipTime
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(function(response) {
      $scope.status = response.status;
      $scope.error = response.data;
      $scope.pass = ($scope.error == "lastownershiptakentime cannot be blank.");
    }, function(response) {
      $scope.status = response.status;
      $scope.error = response.data;
      $scope.pass = ($scope.error == "lastownershiptakentime cannot be blank.");
    })
  };

})

//This doesn't work at all. I don't know the solution. Looking at the JSON string that returns, there is no instance of
//"LastOwnershipTakenTime":XXXX/XX/XX XX:XX:XX anywhere in the string. There are several instances of "id":xxx..xx, so I
//tried using id to get something/anything to print out.

//Based on:
//    var json = '{"count":1, "LastOwnershipTakenTime":"2016/07/06 18:00:00", "count":2}',
//    obj = JSON.parse(json);
//    alert(obj.count);
//
//    prints out: 2 ...

//...I figured that obj.id should print out the last instance of id in the string, but nothing printed. I am not sure
//why. However, since "LastOwnershipTakenTime":XXXX/XX/XX XX:XX:XX does not actually appear in the string, using
//JSON.parse is probably not the answer.
.controller("GetOwnershipRestController", function($scope, $http, $log, $httpParamSerializerJQLike){
  $scope.url = 'https://carebank.carewheels.org:8443/groupmemberinfo.php';
  $scope.fetch = function(userIn, passIn, groupNameIn) {
    $scope.code = null;
    $scope.response = null;
    $http({
      url:$scope.url,
      method:'POST',   //all our custom REST endpoints have been designed to use POST
      data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
        username:userIn,
        password:passIn,
        groupInternalName:groupNameIn,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
      }
    }).then(function(response) {    //the old $http success/error methods have been depricated; this is the new format
        $scope.status = response.status;
        $scope.data = response.data;
        //obj = JSON.parse(response.data);
        //$scope.data = obj.LastOwnershipTakenTime;      // What I hoped would work
        //$scope.data = obj.id;                          // Checking to see if anything works (should contain x of last "id":x)
      }, function(response) {
        $scope.data = response.data || "Request failed";
        $scope.status = response.status;
        if(response.status!=200){
          $log.warn($scope.data);
        }
    })
  };
})

//Call to the UserAndGroupMemberInfo custom rest endpoint, which logs user in and then returns all the field data of all users in their group as $scope.data;
//or one of the following error messages: "Missing username / password", "Invalid username / password", "Your access is blocked by
//exceeding invalid login attempts", or a default catch "Error while performing login: errorCode" or "Error while performing group search".
.controller("UserAndGroupRestController", function($scope, $http, $log, $httpParamSerializerJQLike){
  $scope.url = 'https://carebank.carewheels.org:8443/userandgroupmemberinfo.php';
  $scope.fetch = function(userIn, passIn, tofindIn) {
    $scope.code = null;
    $scope.response = null;
    $http({
      url:$scope.url,
      method:'POST',    //all our custom REST endpoints have been designed to use POST
      data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
        username:userIn,
        password:passIn,
        usernametofind:tofindIn
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
      }
    }).then(function(response) {    //the old $http success/error methods have been depricated; this is the new format
        $scope.status = response.status;
        $scope.data = response.data;
      }, function(response) {
        $scope.data = response.data || "Request failed";
        $scope.status = response.status;
        if(response.status!=200){
          $log.warn($scope.data);
        }
    })
  };
})