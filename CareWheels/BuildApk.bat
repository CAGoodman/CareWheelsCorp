REM Batch file building a releasable APK for ARMv7
REM CareWheels Corporation 2016
REM Author: Ananda Vardhana Nov 22, 2016

@echo MAKE SURE YOU ARE AT THE HOME DIRECTORY EX: ....\CareWheelsCorp\CareWheels
@echo This builds apk for ARMv7 processors only
@IF "%1"=="-?" goto HELP 
@IF "%1"=="-r" goto RESET
@goto CONTINUE
:RESET
ionic state reset
@goto END
:CONTINUE
start cordova build --release android
@echo Did it build successfully install?
@set /p ans=Enter y or n:
@IF "%ans%"=="y" goto CHECK_KEY
@goto END

:CHECK_KEY
@echo Please type in the Date Stamp
@set /p DS=Enter (ddMonthyy, Ex: 25Dec16):
@cd platforms\android\build\outputs\apk
@del CareBank-armv7-%DS%-release-unsigned.apk
@ren android-armv7-release-unsigned.apk CareBank-armv7-%DS%-release-unsigned.apk
@echo Do you want create a new key?
@set /p ans=Enter y or n:
@IF "%ans%"=="y" goto CREATE_KEY
@goto SIGNIT

:CREATE_KEY
@keytool -genkey -v -keystore CareBank_%DS%_key.keystore -alias CareBank_%DS%_key -keyalg RSA -keysize 2048 -validity 10000
@echo It is going to ask you for password: ZXCV(9vcxz
@jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore CareBank_%DS%_key.keystore CareBank-armv7-%DS%-release-unsigned.apk CareBank_%DS%_key
@goto ALIGNIT

:SIGNIT
@echo Please type in the Date Stamp of the stored key
@set /p DSSK=Enter (ddMonthyy, Ex: 25Dec16):
@echo Please type in the full pathname of the stored key
@set /p SKPATH=Path:
@copy %SKPATH%\CareBank_%DSSK%_key.keystore .
@echo It is going to ask you for password: ZXCV(9vcxz
@jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore CareBank_%DSSK%_key.keystore CareBank-armv7-%DS%-release-unsigned.apk CareBank_%DSSK%_key

:ALIGNIT
@del CareBank-armv7-%DS%.apk
@zipalign -v 4 CareBank-armv7-%DS%-release-unsigned.apk CareBank-armv7-%DS%.apk
goto END

:HELP
@echo BuildApk       will not do ionic rest, will not add the platform but just do the full build
@echo BuildApk -r    will reset the ionic state, add the platform and exit will not do the build
@echo Note: First time use -r later on just BuildApk
@echo Set this folder C:\Program Files\Java\jdk1.8.0_102\bin into the path.
@echo Please refer to CBA_DbgDev.docx, Build_Release_Apk.docx and GitHub_Repo_Operation.docx for more details
:END
