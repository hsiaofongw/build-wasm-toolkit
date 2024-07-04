#!/bin/bash

docker run -v $(pwd)/public:/output -it --rm mytoolchain:0.1 cp /build/output/toolchain.wasm /output

