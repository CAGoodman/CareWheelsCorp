/** Call one of this service's functions to create credit the user for one of the types of transactions.
   Parameters
   username: username for login.
   password: password for login.
   usernametocredit: username of the user to credit.
   usernametodebt: username of the user to debt, only needed for a transaction
                   between two users.
   credits as float: Number of credits to credit the user.
   alertlevel as string: Any string to record the alert level of the monitored member,
                         such as "Blue", "Yellow", or "Red".
   callpayment a boolean as String: Records whether or not the crediting is occuring due to
                         a call to a group member. Must be "True" or "False"!
   sensordataviewpayment a boolean as String: Records whether or not the crediting is occuring due to
                         a detailed sensor screen viewing or not. Must be "True" or "False"!
   membersummarypayment a boolean as String: Records whether or not the crediting is occuring due to
                                             a member summary screen viewing or not. Must be "True"
                                             or "False"!
*/

angular.module('careWheels')
.factory("PaymentService", function($http, $httpParamSerializerJQLike, User, API){
  var PaymentService = {};

  //creates a calling transaction; endpoint will also debit the user passed in as userToDebtAsString same amount
  PaymentService.call = function(userToDebtAsString, creditsAsFloat, alertlevelAsString) {
    var myUser = User.credentials();    //get credentials
    if (myUser != undefined) {    //can't do anything without them
      var status = null;
      var response = null;
      $http({
        url: API.creditUser,    //creates URL for REST call
        method: 'POST',    //all our custom REST endpoints have been designed to use POST
        data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
          username: myUser.username,
          password: myUser.password,
          usernametodebt: userToDebtAsString,
          usernametocredit: myUser.username,
          credits: creditsAsFloat,
          alertlevel: alertlevelAsString,
          callpayment: 'True',    //all three of these fields are needed
          sensordataviewpayment: 'False',
          membersummarypayment: 'False'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
        }
      }).then(function (response) {    //the old $http success/error methods have been depricated; this is the new format
        status = response.status;
        data = response.data;
        console.log('Rest Status = ' + status);
      }, function (response) {
        var data = response.data || "Request failed";
        status = response.status;
        if (response.status != 200) {
          console.error(data);
        } else console.log('Success: ' + data);
      })
    } else console.error("Cannot make REST call for Call  Payment because user credentials are undefined.");
  };

  //creates IndividualStatus Sensor View transaction; alertLevel is status of the user that is being viewed
  PaymentService.sensorDataView = function(creditsAsFloat, alertlevelAsString/* targetUser*/) {
    var myUser = User.credentials();
    if (myUser != undefined) {
      var status = null;
      var response = null;
      $http({
        url: API.creditUser,
        method: 'POST',    //all our custom REST endpoints have been designed to use POST
        data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
          username: myUser.username,
          password: myUser.password,
          usernametodebt: '',
          usernametocredit: myUser.username,
          credits: creditsAsFloat,
          alertlevel: alertlevelAsString,
          callpayment: 'False',
          sensordataviewpayment: 'True',
          membersummarypayment: 'False'
          //sensorDataViwed: <targetUser>
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
        }
      }).then(function (response) {    //the old $http success/error methods have been depricated; this is the new format
        status = response.status;
        data = response.data;
        console.log('Rest Status = ' + status);
      }, function (response) {
        var data = response.data || "Request failed";
        status = response.status;
        if (response.status != 200) {
          console.error(data);
        } else console.log('Success: ' + data);
      })
    } else console.error("Cannot make REST call for sensorDataView Payment because user credentials are undefined.");
  };

  //creates home page transaction
  PaymentService.memberSummary = function(creditsAsFloat) {
    var myUser = User.credentials();
    if (myUser != undefined) {
      var status = null;
      var response = null;
      $http({
        url: API.creditUser,
        method: 'POST',    //all our custom REST endpoints have been designed to use POST
        data: $httpParamSerializerJQLike({    //serialize the parameters in the way PHP expects
          username: myUser.username,
          password: myUser.password,
          usernametodebt: '',
          usernametocredit: myUser.username,
          credits: creditsAsFloat,
          alertlevel: 'na',   //field needs to have something in it
          callpayment: 'False',
          sensordataviewpayment: 'False',
          membersummarypayment: 'True'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
        }
      }).then(function (response) {    //the old $http success/error methods have been depricated; this is the new format
        status = response.status;
        data = response.data;
        console.log('Rest Status = ' + status);
      }, function (response) {
        var data = response.data || "Request failed";
        status = response.status;
        if (response.status != 200) {
          console.error(data);
        } else console.log('Success: ' + data);
      })
    } else console.error("Cannot make REST call for memberSummary Payment because user credentials are undefined.");
  };
  return PaymentService;
});
