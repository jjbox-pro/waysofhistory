#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd buildSrc/

bash build_noImages.sh

cd ..

bash build_platforms_debug.sh

#read -p "Press enter to continue..."
