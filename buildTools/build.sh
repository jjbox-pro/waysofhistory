#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

INITIAL_DIR=$PWD

cd ../srcRaw/

bash get_srcRaw.sh

cd $INITIAL_DIR

bash rebuild.sh

#read -p "Press enter to continue..."
