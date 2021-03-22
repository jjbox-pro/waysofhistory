#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../

cordova emulate ios -target="iPhone-7, 14.0"

#read -p "Press enter to continue..."
