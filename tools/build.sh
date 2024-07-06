#!/bin/bash

tagRev=$1
scriptDir=$(dirname $0)

docker build --tag myubuntu:$tagRev $scriptDir/ubuntu
docker build --build-arg JOBS=8 --tag mycoreutils:$tagRev $scriptDir/coreutils
docker build --build-arg JOBS=8 --tag mynode:$tagRev $scriptDir/node
docker build --build-arg JOBS=8 --tag mywabt:$tagRev $scriptDir/wabt
docker build --build-arg JOBS=8 --tag myllvm:$tagRev $scriptDir/llvm
docker build --build-arg JOBS=8 --tag mybinaryen:$tagRev $scriptDir/binaryen
docker build --tag myemcc:$tagRev $scriptDir/emscripten
