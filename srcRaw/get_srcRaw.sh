#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

rm client8.rar
rm client9.rar

lftp -f lftp_script.txt

rm -rf build8
rm -rf build9

unrar x client8.rar
unrar x client9.rar

#read -p "Press enter to continue..."
