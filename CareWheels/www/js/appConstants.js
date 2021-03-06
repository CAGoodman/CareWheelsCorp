angular.module("app.constants", [])
.constant("cbUrls", {"careBankURL8443":"https://CareBank.CareWheels.org:8443",
					"careBankURL8080":"http://CareBank.CareWheels.org:8080" })
.constant("loginDependencies", {
	"downloadInterval": "300000",
	"loginTimeoutPeriod": "60000",
	"redAlertFreq": "2000",
	"downloadTime": "50",
	"userCount": "5",
	"maxHitIndicator":"5",
	"backbuttonTimeout": "100"
})
.constant("traceControls", {
	"info": "0",
	"verbose": "1",
	"warnings": "2",
	"errors": "3"
})