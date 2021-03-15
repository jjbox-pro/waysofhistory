#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

node main.js $1

#read -p "Press enter to continue..."