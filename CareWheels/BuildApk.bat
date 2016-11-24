@echo off
REM Batch file building a releasable APK for ARMv7
REM CareWheels Corporation 2016
REM Author: Ananda Vardhana Nov 22, 2016

echo MAKE SURE YOU ARE AT THE HOME DIRECTORY EX: ....\CareWheelsCorp\CareWheels
echo It is recommended to run ionic reset once every 10 builds
echo This builds apk for ARMv7 processors only
IF "%1"=="-?" goto HELP 
IF "%1"=="-r" goto RESET
goto CONTINUE
:RESET
echo Please note the folder platform will be deleted and recreated so ensure that the folder is not being used
pause
ionic state reset
goto END
:CONTINUE
start cordova build --release android
echo Did it build successfully?
set /p ans=Enter y or n:
IF "%ans%"=="y" goto CHECK_KEY
goto END

:CHECK_KEY
REM Let us get the Date Stamp for naming the APK

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

REM Let us get the saved keystore file name

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
ren android-armv7-release-unsigned.apk CareBank-armv7-%DS%-release-unsigned.apk
echo Do you want to create a new key?
set /p ans=Enter y or n:
IF "%ans%"=="y" goto CREATE_KEY
goto SIGNIT

:CREATE_KEY
REM Delete old key and create a new key
del *.keystore >nul 2>&1
echo It is going to ask you for a password: ZXCV(9vcxz
keytool -genkey -v -keystore CareBank_%DS%_key.keystore -alias CareBank_key_alias -keyalg RSA -keysize 2048 -validity 10000
REM Delte the old saved key and copy new key for subsequent use
del ..\..\..\..\..\*.key >nul 2>&1
move CareBank_%DS%_key.keystore ..\..\..\..\..\ >nul 2>&1
REM We will keep the alias as same and not date stamp it
echo It is going to ask you for a password: ZXCV(9vcxz
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore CareBank_%DS%_key.keystore CareBank-armv7-%DS%-release-unsigned.apk CareBank_key_alias
goto ALIGNIT

:SIGNIT
echo It is going to ask you for a password: ZXCV(9vcxz
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ..\..\..\..\..\%CareBank_Saved_key% CareBank-armv7-%DS%-release-unsigned.apk CareBank_key_alias

:ALIGNIT
del CareBank-armv7-%DS%.apk >nul 2>&1
zipalign -v 4 CareBank-armv7-%DS%-release-unsigned.apk CareBank-armv7-%DS%.apk
goto END

:HELP
echo BuildApk       will not do ionic rest, will not add the platform but just do the full build
echo BuildApk -r    will reset the ionic state, add the platform and exit will not do the build
echo Note: First time use -r later on just use BuildApk
echo Set this folder C:\Program Files\Java\jdk1.8.0_102\bin into the path.
echo Please refer to CBA_DbgDev.docx, Build_Release_Apk.docx and GitHub_Repo_Operation.docx for more details
:END
