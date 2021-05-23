---
title: Maven Central Repository 公開メモ
categories: tech
tags: maven java
header:
  teaser: /assets/posts/2015-12-24-maven-central-repository-800x300.jpg
  og_image: /assets/posts/2015-12-24-maven-central-repository-800x300.jpg
---

Maven Central Repository への公開方法を知っておきたくて、
適当なモジュールを作成/公開してみました。

<!--more-->

この記事は自分用のメモです。
細かいことは書いていません (^^;

## 環境

* CentOS 6.7
* Apache Maven 3.3.3

## 公開したもの

`java.util.ResourceBundle` 経由で YAML ファイルを参照するだけのもの。

[YamlResourceBundle - GitHub](https://github.com/akihyro/yaml-resource-bundle)

## 公開の手順

公式ドキュメントと以下の記事を参考にさせて頂きました。

* 公式ドキュメント
  * [OSSRH Guide](http://central.sonatype.org/pages/ossrh-guide.html)
  * [Requirements](http://central.sonatype.org/pages/requirements.html)
  * [Apache Maven](http://central.sonatype.org/pages/apache-maven.html)
* [はじめての maven central 公開 - たごもりすメモ](http://tagomoris.hatenablog.com/entry/20141028/1414485679)
* [GitHub で公開したソースコードを Maven Central Repository に登録する手順 - Tagbangers Blog](https://blog.tagbangers.co.jp/ja/2015/02/27/to-register-the-source-code-that-was-published-in-github-to-maven-central-repository)
* [【最新版】Maven Central Repository へのライブラリ登録方法 #maven - #侍ズム](http://samuraism.jp/diary/2012/05/03/1336047480000.html)

以降、俺俺メモ。

## 別の artifactId や別の version を公開する場合、 Sonatype JIRA で再申請は必要か？

不要らしい。

Sonatype JIRA での申請 = groupId の申請 (artifactId, version は関係ない) のようで、
1度申請が通れば、別の artifactId, version の追加公開は自由にできました。

なので、サブドメインよりもトップレベルに近いドメインを指定するのが良さそう。
[僕の場合] は、公開するモジュールの groupId は `net.rakugakibox.util` だけど、
申請は `net.rakugakibox` で出しました。

[僕の場合]: https://issues.sonatype.org/browse/OSSRH-17374

## GPG 鍵は CUI ではどう扱う？

### 鍵の作成

```console
$ gpg2 --gen-key
```

> 今から長い乱数を生成します。キーボードを打つとか、マウスを動かす
> とか、ディスクにアクセスするとかの他のことをすると、乱数生成子で
> 乱雑さの大きないい乱数を生成しやすくなるので、お勧めいたします。

ここで止まる場合は、 rngd を動かしておくと良いみたいです。

```console
$ sudo yum install rng-tools
$ sudo rngd -r /dev/urandom
```

### 鍵の表示

```console
$ gpg2 --list-keys
pub   XXXXX/YYYYYYYY yyyy-mm-dd
```

### 鍵の送信

```console
$ gpg2 --keyserver hkp://pool.sks-keyservers.net \
  --send-keys YYYYYYYY  # YYYYYYYY: --list-keys で表示された内容
```
