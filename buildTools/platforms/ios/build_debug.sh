#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../

cordova build ios

#read -p "Press enter to continue..."
