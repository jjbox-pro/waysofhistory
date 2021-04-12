#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../quasar-icongenie

windows() { [[ -n "$WINDIR" ]]; }

if windows
then
    cmd <<< "rmdir src-cordova" > /dev/null
    cmd <<< "mklink /j src-cordova \"../../waysofhistory\"" > /dev/null
else
    rm src-cordova
    ln -s ../../waysofhistory src-cordova
fi

icongenie generate -m cordova -i src-cordova/res/icon.png --theme-color 000

#read -p "Press enter to continue..."
