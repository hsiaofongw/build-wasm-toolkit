#!/bin/bash

tag=$1

if [ -z "$tag" ]; then
  echo "Error. Tag is not present (\$1)"
  exit 1
fi

scriptDir=$(dirname $0)
dockerContextDir=$scriptDir

docker build --target web --tag $tag $dockerContextDir
