#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

platform=$1

run.sh $platform noResources

#read -p "Press enter to continue..."
