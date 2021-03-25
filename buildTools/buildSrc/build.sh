#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

platforms=()
platforms[0]="android|an|8"
platforms[1]="ios|io|9"

noResources=$1

echo "<<< Building resources for platforms >>>"

for platform in ${platforms[@]}
do
	cd build_sources
	bash run.sh "platform=${platform}" $noResources
	cd ..
	cd make_relativeUrls
	bash run.sh "platform=${platform}"
	cd ..
done

echo "<<< Updating version >>>"

cd update_version
bash run.sh

#read -p "Press enter to continue..."
