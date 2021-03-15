#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

platform=$1
noImages=$2

node main.js $platform $noImages

#read -p "Press enter to continue..."