#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../

cordova run android -device

read -p "Press enter to continue..."