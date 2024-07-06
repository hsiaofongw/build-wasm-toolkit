#!/bin/bash

tagRev=$1

if [ -z "$tagRev" ]; then
  echo "Error. The Tag Revision is not present (\$1)"
  exit 1
fi

scriptDir=$(dirname $0)
dockerContextDir=$scriptDir

echo "Building web static files..."
webImgTag="myweb:$tagRev"

docker build --no-cache --build-arg TAGREV=$tagRev --target web --tag $webImgTag $dockerContextDir

echo "Web Image tag: $webImgTag"
