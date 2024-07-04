FROM myubuntu:0.1

# 安装 LLVM (lld, clang)
WORKDIR /build
RUN curl -L -o llvm.tar.xz 'https://github.com/llvm/llvm-project/releases/download/llvmorg-18.1.8/llvm-project-18.1.8.src.tar.xz'
RUN mkdir llvm-project && tar --strip-components 1 -C llvm-project -xf llvm.tar.xz
WORKDIR /build/llvm-project/build
RUN cmake ../llvm -DCMAKE_BUILD_TYPE=Release -DLLVM_ENABLE_PROJECTS='lld;clang' -DLLVM_TARGETS_TO_BUILD="host;WebAssembly" -DLLVM_INCLUDE_EXAMPLES=OFF -DLLVM_INCLUDE_TESTS=OFF
RUN cmake --build . --parallel 8
