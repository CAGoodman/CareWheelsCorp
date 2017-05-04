@echo off & setlocal enableextensions
REM Batch file building a releasable APK for ARMv7 and x86
REM CareWheels Corporation 2016
REM Author: Ananda Vardhana Nov 22, 2016
echo MAKE SURE YOU ARE AT THE HOME DIRECTORY EX: ....\CareWheelsCorp\CareWheels
echo It is recommended to run ionic reset once every 10 builds
echo This builds apk for ARMv7 processors only
echo Ensure your MAILTO in Control Panel --> Programs --> Default Program --> Assocaited is configured correclty

IF "%1"=="-?" goto HELP
IF "%1"=="-p" goto PROPERTY
IF "%1"=="-r" goto RESET
IF "%1"=="-a" goto ADD_PLATFORM
IF "%1"=="-v" goto RESET_VERSION
IF "%1"=="-maj" goto RESET_MAJOR_VERSION
IF "%1"=="-min" goto RESET_MINOR_VERSION
goto GET_DATE
:PROPERTY
gulp getProperty
goto END
:RESET
echo Please ensure platform folder is free for deletion. Command prompt or explorer should be out of it
echo Please note the folder platform will be deleted and recreated so ensure that the folder is not being used
echo You have to run BuildApk -a to add the platform.
pause
ionic state reset                                                                                                        
goto END
:ADD_PLATFORM
cordova platform add android
goto END
:RESET_VERSION
IF "%2"=="" goto VER_ERR
gulp resetVersion --version "%2"
goto END
:RESET_MAJOR_VERSION
gulp bumpMajor
goto END
:RESET_MINOR_VERSION
gulp bumpMinor
goto END

:GET_DATE
set month-num=%date:~3,3%
if %month-num%==01 set mo-name=Jan
if %month-num%==02 set mo-name=Feb
if %month-num%==03 set mo-name=Mar
if %month-num%==04 set mo-name=Apr
if %month-num%==05 set mo-name=May
if %month-num%==06 set mo-name=Jun
if %month-num%==07 set mo-name=Jul
if %month-num%==08 set mo-name=Aug
if %month-num%==09 set mo-name=Sep
if %month-num%==10 set mo-name=Oct
if %month-num%==11 set mo-name=Nov
if %month-num%==12 set mo-name=Dec
set day-num=%date:~7,2%
set year-num=%date:~12,8%
REM Here we get the Date Stamp
set DS=%day-num%%mo-name%%year-num%
REM APK name is bumped up in package.json
start gulp bumpApk --apk "CareBank-armv7-%DS%.apk"
echo Did the bumpApk finish successfully?
set /p ans=Enter y or n:
IF "%ans%"=="y" goto DO_BUMPALL
goto END

:DO_BUMPALL
REM This calls bumpPatch, bumpDate, bumpConstants and finally calls getProperty
REM bumpApk, bumpPatch, bumpDate all bump it up in the package.json only
REM bumpConstants creates a new file ngconstants.js which gets bundled with the APK
REM ngconstants.js has all the source/binary controls

IF "%1"=="-d" (
start /min gulp resetVersion --version "9.9.8"
pause
)
start gulp bumpAll
echo Did the bumpAll finish successfully?
set /p ans=Enter y or n:
IF "%ans%"=="y" goto APK_BUILD
goto END

:APK_BUILD
REM We get the bumped up Version from package.json and update config.xml
IF "%1"=="-d" (
start /min cordova-update-config --appname "CareBank-BetaDbg"
) ELSE (
start /min cordova-update-config --appname "CareBank-BetaRel"
)
pause
start /min cordova-update-config --appid "org.carewheels.carebank1"
pause
@FOR /F "eol=; tokens=1,2* delims=, " %%i in (package.json) do (
@IF %%i=="apkVersion": (
set apkVersion=%%j
goto VERSION_DONE
)
)
:VERSION_DONE
start /min cordova-update-config --appversion %apkVersion%
pause
IF "%1"=="-d" (
del platforms\android\build\outputs\apk\*.apk
start cordova build --debug android
echo Did it build successfully?
set /p ans=Enter y or n:
cd platforms\android\build\outputs\apk
ren android-armv7-debug.apk CareBank-armv7-%DS%-debug.apk
ren android-x86-debug.apk CareBank-x86-%DS%-debug.apk
echo Debug build done!!
goto END
) ELSE (
del platforms\android\build\outputs\apk\*.apk
start cordova build --release android
)
REM At this point we get the file platforms\android\build\outputs\apk\android-release-unsigned.apk
echo Did it build successfully?
set /p ans=Enter y or n:
IF "%ans%"=="y" goto CHECK_KEY
goto END

:CHECK_KEY
REM Let us get the Date Stamp for naming the APK

REM Let us get the saved keystore file name
set CareBank_Saved_key=""
dir /B *.*keystore > KeyFileName.txt
set /a N=0
for /f "tokens=* delims= " %%a in (KeyFileName.txt) do (
set /a N+=1
set v[!N!]=%%a
)

del KeyFileName.txt >nul 2>&1

REM If the keystore file is not there then CareBank_Saved_key will be empty
REM if there are more then one keystore file we will get the alphabetically the last one.
REM It is users responsibility to have a single file there
set CareBank_Saved_key=%v[!N!]%

cd platforms\android\build\outputs\apk

REM During devleopemnt we build many times and it is possible the old APK is still there so need to delete it
del CareBank-armv7-%DS%-release-unsigned.apk >nul 2>&1
REM if %CareBank_Saved_key%=="" goto CREATE_KEY
if %CareBank_Saved_key%=="" goto NO_KEY
echo We have found a saved key %CareBank_Saved_key%
REM echo Do you want to use the old key? If you say no then we will create a new key
REM set /p ans=Enter y or n:
REM IF "%ans%"=="n" goto CREATE_KEY
goto SIGNIT

REM****************************** KEY GENERATION SKIPPED BEGIN*************************************
REM If you want to generate key uncomment above 4 lines of code and comment the NO_KEY line
:NO_KEY
echo No key store was found please contact Claude A Goodman for the keystore
goto END

:CREATE_KEY
REM Delete old key and create a new key
del *.keystore >nul 2>&1
echo It is going to ask you for a password:
keytool -genkey -v -keystore CareBank_%DS%_key.keystore -alias CareBank_key_alias -keyalg RSA -keysize 2048 -validity 10000
REM Delte the old saved key and copy new key for subsequent use
del ..\..\..\..\..\*.key >nul 2>&1
move CareBank_%DS%_key.keystore ..\..\..\..\..\ >nul 2>&1
REM We will keep the alias as same and not date stamp it
REM****************************** KEY GENERATION SKIPPED END*************************************

:SKIP_KEY
echo It is going to ask you for a password:
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ..\..\..\..\..\CareBank_%DS%_key.keystore android-armv7-release-unsigned.apk CareBank_key_alias
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ..\..\..\..\..\CareBank_%DS%_key.keystore android-x86-release-unsigned.apk CareBank_key_alias
goto ALIGNIT

:SIGNIT
echo It is going to ask you for a password:

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ..\..\..\..\..\%CareBank_Saved_key% android-armv7-release-unsigned.apk CareBank_key_alias
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ..\..\..\..\..\%CareBank_Saved_key% android-x86-release-unsigned.apk CareBank_key_alias

rem To verify a apk is signed or unsinged use the following command
rem jarsigner -verify -verbose -certs

:ALIGNIT
del CareBank-armv7-%DS%.apk >nul 2>&1
zipalign -v 4 android-armv7-release-unsigned.apk CareBank-armv7-%DS%.apk
zipalign -v 4 android-x86-release-unsigned.apk CareBank-x86-%DS%.apk
goto END

:HELP
echo Description: On a clean gitHub repo download do the following operation:
echo BuildApk -a; BuildApk -r; Then if you want to mess with versions BuildApk -v or -maj or -min.
echo When all of the above are done then do just BuildApk.
echo Details:
echo BuildApk       will not do ionic rest, will not add the platform but just do the full build.
echo BuildApk -r    will reset the ionic state, and exit will not do the build.
echo BuildApk -a    will add the platform and exit will not do the build.
echo Version is shown as Major.Minor.Patch. Ex: 2.4.5. Version can be totally reset or bump either
echo Major or Minor part.
echo Version bumping is optional by default the patch number is bumped.
echo BuildApk -v <Version Number>   will reset the full version number.
echo BuildApk -maj  will bump the major part of the version.
echo BuildApk -min  will bump the minor part of the version.
echo BuildApk -p  will get the full property of the APK.
echo Note: First time use -r later on just use BuildApk.
echo Set this folder C:\Program Files\Java\jdk1.8.0_102\bin into the path.
echo Please refer to CBA_DbgDev.docx, Build_Release_Apk.docx and
echo GitHub_Repo_Operation.docx for more details.
goto END
:VER_ERR
echo Usage: BuildApk -v "Version to reset"
:END
del android-armv7-debug-unaligned.apk android-armv7-release-unsigned.apk android-x86-debug-unaligned.apk android-x86-release-unsigned.apk