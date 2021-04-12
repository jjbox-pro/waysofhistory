#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

INITIAL_DIR=$PWD


platforms=()

cd ../platforms

for dir in $(find . -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)
do
	platforms+=("${dir}")
done


if [ ${#platforms[@]} -eq 0 ];
then
    echo "No platforms specified. Add platform to cordova project."
	
	exit
fi


IFS=$'\n' platforms=($(sort <<<"${platforms[*]}"))
unset IFS


cd $INITIAL_DIR


if [ -n "$1" ]
then
	buildConfig=$1
else
	buildConfig=debug
fi

for platform in ${platforms[@]}
do
	echo "Build ${platform}"
	cd platforms/${platform}
	bash build_${buildConfig}.sh
	cd ../../
done

#read -p "Press enter to continue..."
