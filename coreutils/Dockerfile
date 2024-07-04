FROM myubuntu:0.1

# 编译 coreutils
WORKDIR /build
RUN curl -O https://ftp.gnu.org/gnu/coreutils/coreutils-9.5.tar.xz
RUN tar -xf coreutils-9.5.tar.xz
ENV FORCE_UNSAFE_CONFIGURE 1
WORKDIR /build/coreutils-9.5
RUN ./configure && make -j 8
RUN rm /build/coreutils-9.5.tar.xz

