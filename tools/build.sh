#!/bin/bash

tagRev=$1

if [ -z "$tagRev" ]; then
  echo "Error. The Tag Revision is not present (\$1)"
  exit 1
fi

scriptDir=$(dirname $0)

docker build --build-arg JOBS=8 --tag mycoreutils:$tagRev $scriptDir/coreutils
docker build --tag myemcc:$tagRev $scriptDir/emscripten
