#!/usr/bin/env

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../www

windows() { [[ -n "$WINDIR" ]]; }

if windows
then
    cmd <<< "mklink /j src \"../src/platforms/android\"" > /dev/null
else
    ln -s "src" "../src/platforms/android"
fi

#read -p "Press enter to continue..."