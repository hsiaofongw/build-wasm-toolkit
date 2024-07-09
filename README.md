## 简介

该项目是将 coreutils 下的一小部分代码移植到 WASM target 的一个尝试。

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
