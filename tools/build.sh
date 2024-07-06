#!/bin/bash

tagRev=$1

if [ -z "$tagRev" ]; then
  echo "Error. The Tag Revision is not present (\$1)"
  exit 1
fi

scriptDir=$(dirname $0)

docker build --tag myubuntu:$tagRev $scriptDir/ubuntu
docker build --build-arg JOBS=8 --tag mycoreutils:$tagRev $scriptDir/coreutils
docker build --build-arg JOBS=8 --tag mywabt:$tagRev $scriptDir/wabt
docker build --build-arg JOBS=8 --tag mybinaryen:$tagRev $scriptDir/binaryen
docker build --tag myemcc:$tagRev $scriptDir/emscripten
