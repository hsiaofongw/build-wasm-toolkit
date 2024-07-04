FROM ubuntu:22.04

# 安装基础编译环境
RUN sed -i 's/ports.ubuntu.com/mirrors.cloud.tencent.com/g' /etc/apt/sources.list
RUN apt-get update && apt-get -y install curl tar build-essential gcc cmake python3 git ninja-build
