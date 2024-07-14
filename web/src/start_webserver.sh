#!/bin/bash

scriptDir=$(dirname $0)
scriptDir=$(realpath $scriptDir)

docker run \
  -dit \
  --name wasm-examples \
  -v $scriptDir/examples:/usr/share/nginx/html:ro \
  -v $scriptDir/nginx-conf.d/mime.types:/etc/nginx/mime.types:ro \
  -v $scriptDir/nginx-conf.d/default.conf:/etc/nginx/conf.d/default.conf:ro \
  -p 80 \
  --rm nginx:latest
