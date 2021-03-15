#!/usr/bin/env

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../quasar-icongenie

windows() { [[ -n "$WINDIR" ]]; }

if windows
then
    cmd <<< "mklink /j src-cordova \"../../waysofhistory\"" > /dev/null
else
    ln -s "src-cordova" "../../waysofhistory"
fi

icongenie generate -m cordova -i src-cordova/res/icon.png --theme-color 000

read -p "Press enter to continue..."