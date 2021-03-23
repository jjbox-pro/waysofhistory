#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

bash build_platforms.sh release

#read -p "Press enter to continue..."
