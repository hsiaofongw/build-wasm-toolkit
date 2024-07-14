#!/bin/bash

scriptDir=$(dirname $0)
scriptDir=$(realpath $scriptDir)

docker run \
  -dit \
  --name wasm-examples \
  -v $scriptDir/examples:/usr/share/nginx/html:ro \
  -v $scriptDir/nginx-conf.d:/etc/nginx/conf.d:ro \
  -p 80 \
  --rm nginx:latest
