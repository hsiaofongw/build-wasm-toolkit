## 简介

该项目是将 coreutils（以及其它 C 语言生态系统下的 libs）移植到 WASM 虚拟机的一个尝试。

## 构建

```bash
tagRevision=test
tools/build.sh $tagRevision
web/build.sh $tagRevision
```
