#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

INITIAL_DIR=$PWD


platforms=()

cd ../platforms/

for dir in *
do
	platforms+=("${dir}")
done

cd $INITIAL_DIR


if [ -n "$1" ]
then
	buildConfig=$1
else
	buildConfig=debug
fi

for platform in ${platforms[@]}
do
	cd platforms/${platform}
	bash run_build_${buildConfig}.sh
	cd ../../
done

read -p "Press enter to continue..."