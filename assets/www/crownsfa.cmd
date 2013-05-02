@echo off
setlocal

REM Erase local storage contents
if not exist "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\Local Storage\file__0.localstorage" goto :erasedatabasefiles
echo Erasing local storage contents
erase "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\Local Storage\file__0.localstorage*" /q

REM Copy preloaded database to where Chrome Desktop expected to find it
:erasedatabasefiles
if not exist "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\databases" goto nodatabasesdir
echo Erasing database files
erase "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\databases\Databases.db*" /q
if not exist "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\databases\file__0\1" goto copydatabasefiles
erase "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\databases\file__0\1" /q
goto :copydatabasefiles

:nodatabasesdir
echo Making Chrome databases directory
mkdir "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\databases"

:copydatabasefiles						
echo Copying Crown SFA database files													 
copy ..\database\DatabasesForChromeDesktop.db "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\databases\Databases.db"
if exist "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\databases\file__0" goto databasesubdirexists
mkdir "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\databases\file__0"

:databasesubdirexists
copy ..\database\file__0\0000000000000001.db "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\databases\file__0\1"

echo Starting Crown SFA inside Google Chrome
"%USERPROFILE%\AppData\Local\Google\Chrome\Application\chrome.exe" %~dp0login.html --allow-file-access-from-files --disable-web-security 
endlocal
