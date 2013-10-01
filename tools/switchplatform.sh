function switchToAndroid() {
    echo "Switching $1 to Android version of Phonegap"
    cat $1 | sed 's/cordova-2\.3\.0\.ios\.js/cordova-2\.9\.0\.android\.js/' > temp.html
    mv temp.html $1
}

function switchToiOS() {
    echo "Switching $1 to iOS version of Phonegap"
    cat $1 | sed 's/cordova-2\.3\.0\.android\.js/cordova-2\.9\.0\.ios\.js/' > temp.html
    mv temp.html $1
}

if [ $# -eq 0 ]; then
    echo "switchplatform <android|ios>"
    exit
fi

pushd ../assets/www > /dev/null
if [ "$1" = "ios" ]; then  
    for file in *.html; do switchToiOS $file; done
elif [ "$1" = "android" ]; then
    for file in *.html; do switchToAndroid $file; done
else
    echo "*** ERROR *** '$1' is not a valid platform"
fi
popd > /dev/null
