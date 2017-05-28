/*++
  CareWheels Corporation 2016
  Filename: PaymentService.js
  Description: Anything to do with Payments come here

  Authors: Capstone students PSU Aug 2016
  Revision: Ensured Selfview does not get credited - NXB/AV 01/17/2017
       Implemented Refresh on pull up - NXB 01/09/2017

  Call one of this service's functions to create credit the user for one of the types of transactions.
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
.factory("PaymentService", function($http, $httpParamSerializerJQLike, $ionicPopup, User, API, fileloggerService){
  var PaymentService = {};

  //
  // We come here when there is a meds alert and the "CAll" button has been enbaled and the user
  // has pressed to make the call. That creates a calling transaction; endpoint will also debit
  // the user passed in as userToDebtAsString same amount
  //

  PaymentService.call = function(userToDebtAsString, alertlevelAsString) {
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
          alertlevel: alertlevelAsString,
          callpayment: 'True',    //all three of these fields are needed
          sensordataviewpayment: 'False',
          membersummarypayment: 'False'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
        }
      }).then(function successCallback(response) {    //the old $http success/error methods have been depricated; this is the new format
        User.hidePassword(response, 'PS');
        fileloggerService.info('PS:call():Call PaymentCredit: ' + JSON.stringify(response));
      }, function errorCallback(response) {
        User.hidePassword(response, 'PS');
        var data = response.data || "Request failed";
        if (response.status != 200) {
          if (response.status == -1 && response.statusText === "") { // When net work is down the errorCode = -1 meaning ERR_NETWORK_IO_SUSPENDED
            User.getHttpErrorCode("PaymentService.call", response);
          }
          $ionicPopup.alert({
            title: "Proper credit for your Call could not be made due to network or other issues",
            subTitle: "Please contact your friendly CareBank customer support for help"
          });
          fileloggerService.error("PaymentServ: call: CreditPosted: " + data + ", ReasonCode: " + response.statusText);
          fileloggerService.error("PaymentServ: call: " + JSON.stringify(response));
        } else fileloggerService.info("PaymentServ: call: Success: " + "CreditPosted: " + data.creditPosted + "ReasonCode: " + data.reasonCode);
      })
    } else {
    $ionicPopup.alert({
        title: "Proper credit for your Call could not be made as there is a problem with your credentials",
        subTitle: "Please contact your friendly CareBank customer support for help"
      });
      fileloggerService.error("PaymentServ: call:Cannot make REST call for Call  Payment because user credentials are undefined.");
    }
  };    // PaymentService.call

  //
  // When user taps on any individual we come here, including self.
  // This creates IndividualStatus Sensor View transaction; alertLevel is status of the user that is being viewed
  // A credit of 0.1T$ is credit for this except for self view.
  //

  PaymentService.sensorDataView = function(alertlevelAsString, targetUser) {
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
          alertlevel: alertlevelAsString,
          callpayment: 'False',
          sensordataviewpayment: 'True',
          membersummarypayment: 'False',
          vieweduser: targetUser           // Incase of self view creditng should be avoided hence this passed
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
        }
      }).then(function successCallback(response) {    //the old $http success/error methods have been depricated; this is the new format
        User.hidePassword(response, 'PS');
        fileloggerService.info('PaymentServ: sensorDataView():IS PaymentCredit: ' + JSON.stringify(response));
      }, function errorCallback(response) {
        User.hidePassword(response, 'PS');
        var data = response.data || "Request failed";
        status = response.status;
        if (response.status != 200) {
          if (response.status == -1 && response.statusText === "") { // When net work is down the errorCode = -1 meaning ERR_NETWORK_IO_SUSPENDED
            User.getHttpErrorCode("PaymentService.sensorDataView: ", response);
          }
          $ionicPopup.alert({
            title: "Sensor data view did not get the proper credit",
            subTitle: "Please contact your friendly CareBank customer support for help"
          });
          fileloggerService.error("PaymentServ:sensorDataView: CreditPosted: " + data + ", ReasonCode: " + response.statusText);
          fileloggerService.error("PaymentServ:sensorDataView: " + JSON.stringify(response));
        } else fileloggerService.info("PaymentServ:sensorDataView: Success: " + "CreditPosted: " + data.creditPosted +
                "ReasonCode: " + data.reasonCode);
      })
    } else {
       $ionicPopup.alert({
        title: "Sensor data view did not get the proper credit because there was some credential issues",
        subTitle: "Please contact your friendly CareBank customer support for help"
      });
      fileloggerService.error("PaymentServ:sensorDataView: Cannot make REST call for sensorDataView Payment because user credentials are undefined.");
    }
  };  // PaymentService.sensorDataView

  //
  // So there is three types of transactoion for which a user gets paid 0.1T$%. Call, individual status view and
  // Group Status view. SO when ever the user views the Group status the control comes here to credit user 0.1T$
  // This creates home page transaction
  //

  PaymentService.memberSummary = function() {
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
          alertlevel: 'na',   //field needs to have something in it
          callpayment: 'False',
          sensordataviewpayment: 'False',
          membersummarypayment: 'True'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'   //make Angular use the same content-type header as PHP
        }
      }).then(function successCallback(response) {    //the old $http success/error methods have been depricated; this is the new format
        User.hidePassword(response, 'PS');
        fileloggerService.info("PaymentServ: memberSummary:Group Status PaymentCredit: " + JSON.stringify(response));
      }, function errorCallback(response) {
        User.hidePassword(response, 'PS');
        var data = response.data || "Request failed";
        if (response.status != 200) {
          if (response.status == -1 && response.statusText === "") { // When net work is down the errorCode = -1 meaning ERR_NETWORK_IO_SUSPENDED
            User.getHttpErrorCode("PaymentService.sensorDataView: ", response);
          }
          $ionicPopup.alert({
            title: "Group view did not get the proper credit",
            subTitle: "Please contact your friendly CareBank customer support for help"
          });
          fileloggerService.error("PaymentServ: memberSummary: CreditPosted: " + data + ", ReasonCode: " + response.statusText);
          fileloggerService.error("PaymentServ: memberSummary: " + JSON.stringify(response));
        } else fileloggerService.info("PaymentServ: memberSummary: Success: " + "CreditPosted: " + data.creditPosted + " ReasonCode: " + data.reasonCode);
      })
    } else  {
      $ionicPopup.alert({
        title: "Group view did not get the proper credit because of bad credentials",
        subTitle: "Please contact your friendly CareBank customer support for help"
      });
      fileloggerService.error("PaymentServ: memberSummary: Cannot make REST call for memberSummary Payment because user credentials are undefined.");
    }
  };
  return PaymentService;
}); // PaymentService.memberSummary
