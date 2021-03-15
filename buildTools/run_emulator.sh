#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ..

cordova emulate android

#read -p "Press enter to continue..."