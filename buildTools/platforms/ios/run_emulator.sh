#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../

cordova emulate ios

#read -p "Press enter to continue..."