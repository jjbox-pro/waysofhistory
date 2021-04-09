#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../

cordova build ios -release

#read -p "Press enter to continue..."
