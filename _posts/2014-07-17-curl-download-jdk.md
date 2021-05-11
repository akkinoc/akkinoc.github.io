---
title: CentOS に Oracle JDK を curl コマンドでダウンロード, ついでに Chef レシピも
categories: tech
tags: centos java shell bash chef
header:
  teaser: /assets/posts/2014-07-17-curl-download-jdk-800x266.png
  overlay_image: /assets/posts/2014-07-17-curl-download-jdk-800x266.png
  caption: Photo by [Project Kenai](https://duke.kenai.com/models)
---

毎回ブラウザから Oracle JDK をダウンロードするのが面倒だったのでコマンド化した。
Oracle JDK のダウンロードはライセンス同意のチェックが厄介。

<!--more-->

## 参考

こちらを参考にさせて頂いた。

* [curl で JDK をダウンロード - OT メモ帳](http://nori3tsu.hatenablog.com/entry/2013/11/02/130927)
* [JDK を wget で直接ダウンロードしたいとき - OpenGroove](http://open-groove.net/java/jdk-wget/)

ただ自分の環境では "Unauthorized Request" な HTML しかダウンロード出来なかった。

## Oracle JDK をダウンロードするコマンド

2014/07/17 時点、こちらで通った。
必要な Cookie (oraclelicense) が増えたんだろうか。

### JDK7 (Java SE Development Kit 7u65 - Linux x64)

```shell
curl -L -o /tmp/jdk-7u65-linux-x64.rpm \
  -H 'Cookie: gpw_e24=http%3A%2F%2Fwww.oracle.com; oraclelicense=accept-securebackup-cookie' \
  'http://download.oracle.com/otn-pub/java/jdk/7u65-b17/jdk-7u65-linux-x64.rpm'
```

### JDK8 (Java SE Development Kit 8u11 - Linux x64)

```shell
curl -L -o /tmp/jdk-8u11-linux-x64.rpm \
  -H 'Cookie: gpw_e24=http%3A%2F%2Fwww.oracle.com; oraclelicense=accept-securebackup-cookie' \
  'http://download.oracle.com/otn-pub/java/jdk/8u11-b12/jdk-8u11-linux-x64.rpm'
```

## インストール

ついでにインストール。普通に rpm を回す。

```shell
rpm -ivh /tmp/jdk-7u65-linux-x64.rpm
```

## Chef のレシピも書いてみた

[Opscode の Cookbook] ([socrata-cookbooks/java]) もあるようだけど、自前でやる用に。
`remote_file` でやろうと思ったけど、 Cookie の指定方法が分からなかったので `bash` で :)

[Opscode の Cookbook]: http://community.opscode.com/cookbooks/java
[socrata-cookbooks/java]: https://github.com/socrata-cookbooks/java

```ruby
bash '/tmp/jdk-7u65-linux-x64.rpm' do
  not_if "test -f /tmp/jdk-7u65-linux-x64.rpm"
  code <<-EOC
    curl -L -o /tmp/jdk-7u65-linux-x64.rpm \
      -H 'Cookie: gpw_e24=http%3A%2F%2Fwww.oracle.com; oraclelicense=accept-securebackup-cookie' \
      'http://download.oracle.com/otn-pub/java/jdk/7u65-b17/jdk-7u65-linux-x64.rpm'
  EOC
end

rpm_package 'jdk-7u65-linux-x64' do
  source '/tmp/jdk-7u65-linux-x64.rpm'
end
```
