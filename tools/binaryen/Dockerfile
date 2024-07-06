FROM myubuntu:0.1

ARG JOBS=8

# 编译 binaryen
WORKDIR /build
RUN git clone https://github.com/WebAssembly/binaryen.git
WORKDIR /build/binaryen
RUN git submodule init
RUN git submodule update
RUN cmake . && make -j ${JOBS}
