#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cordova requirements

read -p "Press enter to continue..."
