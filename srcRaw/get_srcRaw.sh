#!/bin/sh

cd -- "$(dirname "$BASH_SOURCE")"

rm client8.rar
rm client9.rar

lftp -f lftp_script.txt

unrar x client8.rar -o+
unrar x client9.rar -o+

#read -p "Press enter to continue..."
