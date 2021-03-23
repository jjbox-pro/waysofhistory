#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../

cordova build android -release

#read -p "Press enter to continue..."