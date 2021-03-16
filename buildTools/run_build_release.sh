#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

platforms=()
platforms[0]="android"
platforms[1]="ios"

for platform in ${platforms[@]}
do
	cd platforms/${platform}
	bash run_build_release.sh
	cd ../../
done

#read -p "Press enter to continue..."