#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../

cordova run ios -device

#read -p "Press enter to continue..."