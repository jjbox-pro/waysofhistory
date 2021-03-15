#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ..

cordova run -device

#read -p "Press enter to continue..."