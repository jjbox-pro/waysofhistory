#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

bash build.sh noImages

read -p "Press enter to continue..."