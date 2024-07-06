FROM ubuntu:22.04

RUN \
  apt-get update && \
  apt-get -y install git python3 tar xz-utils


# 安装 emscripten
WORKDIR /build
RUN git clone https://github.com/emscripten-core/emsdk.git
WORKDIR /build/emsdk
RUN ./emsdk install latest
RUN ./emsdk activate latest

COPY <<EOF /etc/profile.d/activate_emsdk.sh
. /build/emsdk/emsdk_env.sh
EOF

CMD bash -l
