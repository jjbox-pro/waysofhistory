#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

platforms=()
platforms[0]="android|an|8"
#platforms[1]="ios|io|9"

noImages=$1

for platform in ${platforms[@]}
do
	echo "<<< building for platform: ${platform} >>>"
	cd build_sources
	bash run.sh "platform=${platform}" $noImages
	cd ..
	cd make_relativeUrls
	bash run.sh $platform
	cd ..
done

#for file in *
#do
#	bash $file/build_noImages.sh
#done

#read -p "Press enter to continue..."