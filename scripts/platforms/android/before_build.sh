#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../www

windows() { [[ -n "$WINDIR" ]]; }

if windows
then
	cmd <<< "rmdir src" > /dev/null
    cmd <<< "mklink /j src \"../src/platforms/android\"" > /dev/null
else
	rm src
    ln -s ../src/platforms/android src
fi

#read -p "Press enter to continue..."