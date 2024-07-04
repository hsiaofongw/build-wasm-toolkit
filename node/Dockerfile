FROM myubuntu:0.1

# 安装 NodeJS 20.15.0 (LTS)
WORKDIR /build
RUN mkdir node-src
RUN curl -v -L -o - 'https://nodejs.org/dist/v20.15.0/node-v20.15.0.tar.gz' | tar --strip-component 1 -zx -C node-src
WORKDIR /build/node-src
RUN ./configure && make -j 8 
