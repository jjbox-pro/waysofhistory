#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../platforms/android

windows() { [[ -n "$WINDIR" ]]; }

if windows
then
    gradlew :app:bundleRelease
else
    ./gradlew :app:bundleRelease
fi

#read -p "Press enter to continue..."
