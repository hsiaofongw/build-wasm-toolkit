#!/bin/bash

docker run -dit -v $(pwd):/usr/share/nginx/html -p 80 --rm nginx:latest

