#!/usr/bin/env

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../waysofhistory-icons

icongenie generate -m cordova -i src-cordova/res/icon.png --theme-color 000

#read -p "Press enter to continue..."