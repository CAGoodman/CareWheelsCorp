/**
 * Vacation controller
 */

angular.module('careWheels')

.controller('vacationController', function($scope, $controller, GroupInfo, User) {

    $scope.value = User.getVacationValue();

    $scope.toggleVacationMode = function () {

		var creds = User.credentials();
		var newValue;

		if ($scope.value == false) {
			newValue = 'True';
		} else {
			newValue = 'False';
		}

		// console.log('testToggle changed to ' + $scope.value);

		User.setOnVacation(creds.username, creds.password, newValue).then(function(resultValue){

			if(resultValue) {
				if ($scope.value == false) {
					$scope.value = true;
				} else {
					$scope.value = false;
				}
				User.setVacationValue($scope.value);
			} else {
			  $scope.value.Selected=$scope.value;
			}
		});
    };
});
