#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

platform=$1
noResources=$2

node main.js $platform $noResources

#read -p "Press enter to continue..."
