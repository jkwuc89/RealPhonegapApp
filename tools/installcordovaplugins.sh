#!/bin/sh

#
# Install desired plugins
# #1 = platform (ios or android)
#
function installPlugins() {
    for plugin in battery-status camera console device device-motion device-orientation file geolocation network-information vibration
    do
        pluginURL="https://git-wip-us.apache.org/repos/asf/cordova-plugin-${plugin}.git"
        echo "Installing $1 $pluginURL"
        plugman install --platform $1 --project ~/projects/git/RealPhonegapApp --plugin ${pluginURL}
    done
}

if [ "$1" = "ios" ]; then
    installPlugins $1
elif [ "$1" = "android" ]; then
    installPlugins $1
else
    echo "*** ERROR *** '$1' is not a supported platform"
fi



