## 简介

该项目是将 coreutils（以及其它 C 语言生态系统下的 libs）移植到 WASM 虚拟机的一个尝试。

## 构建

```bash
tag=myweb:test
web/build.sh $tag
```

## 部署

```bash
tag=myweb:test
docker run -dit --rm -p 10080:80 $tag
```

访问 [localhost:10080](http://localhost:10080)。
