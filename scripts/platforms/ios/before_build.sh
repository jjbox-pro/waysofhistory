#!/usr/bin/env

cd -- "$(dirname "$BASH_SOURCE")"

cd ../../../www

windows() { [[ -n "$WINDIR" ]]; }

if windows
then
    cmd <<< "mklink /j src \"../src/platforms/ios\"" > /dev/null
else
    ln -s "src" "../src/platforms/ios"
fi

#read -p "Press enter to continue..."