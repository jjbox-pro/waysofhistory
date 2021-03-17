#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../

find ./ -type f -iname "*.sh" -exec chmod +x {} \;

#read -p "Press enter to continue..."
