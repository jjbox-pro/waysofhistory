#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../

cordova build android

#read -p "Press enter to continue..."