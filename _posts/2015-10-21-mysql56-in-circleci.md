---
title: CircleCI で MySQL 5.6.23 を使う (現 Amazon RDS の最新版と同じバージョン)
categories: tech
tags: circleci mysql amazon-rds aws
header:
  teaser: /assets/posts/2015-10-21-mysql56-in-circleci-800x300.jpg
---

CircleCI に MySQL 5.6.23 をインストールする方法をまとめました。
現 Amazon RDS の最新版と同じバージョンです。

<!--more-->

きっかりマイナーバージョンまで指定したパッケージを使ってるので、
未確認ですが 5.6.x 系ならお好みのものを使えると思います。

## 事の発端

本番で使う予定の Amazon RDS (MySQL) と
同じ DBMS, 同じバージョンを使って CircleCI でテストを回したい！

でも CircleCI の MySQL は 5.5 しか入ってない...
調べてもマイナーバージョンまでは指定のない記事が多い...
(できればマイナーバージョンまで合わせておきたい派です)

とゆーわけで自力でパッケージをダウンロード＆インストールしました。

## CircleCI 環境

> * Architecture: x86_64
> * Username: ubuntu
> * Ubuntu 12.04 (precise)
> * Kernel version: 3.2
>
> <footer><cite><a href="https://circleci.com/docs/environment">Test environment - CircleCI</a></cite></footer>

パッケージはこの環境に合うものを使いました。

## circle.yml

こんな `circle.yml` でいけました。

```yaml
machine:
  environment:
    DEBIAN_FRONTEND: noninteractive
    MYSQL_DL_URL: http://downloads.mysql.com/archives/get/file
dependencies:
  override:
    - mkdir -p ~/mysql-packages
    - >
      [ -e ~/mysql-packages/mysql-common_5.6.23-1ubuntu12.04_amd64.deb ] \
        || wget $MYSQL_DL_URL/mysql-common_5.6.23-1ubuntu12.04_amd64.deb -P ~/mysql-packages
    - >
      [ -e ~/mysql-packages/mysql-community-server_5.6.23-1ubuntu12.04_amd64.deb ] \
        || wget $MYSQL_DL_URL/mysql-community-server_5.6.23-1ubuntu12.04_amd64.deb -P ~/mysql-packages
    - >
      [ -e ~/mysql-packages/mysql-community-client_5.6.23-1ubuntu12.04_amd64.deb ] \
        || wget $MYSQL_DL_URL/mysql-community-client_5.6.23-1ubuntu12.04_amd64.deb -P ~/mysql-packages
    - sudo apt-get remove --purge 'mysql-*'
    - sudo apt-get install libaio1
    - sudo dpkg -i ~/mysql-packages/mysql-common_5.6.23-1ubuntu12.04_amd64.deb
    - sudo dpkg -i ~/mysql-packages/mysql-community-server_5.6.23-1ubuntu12.04_amd64.deb
    - sudo dpkg -i ~/mysql-packages/mysql-community-client_5.6.23-1ubuntu12.04_amd64.deb
  cache_directories:
    - ~/mysql-packages
```

* 大まかな流れ:
  1. deb パッケージをダウンロード。
  2. 既存の MySQL をアンインストール。
  3. ダウンロードしたパッケージをインストール。
* deb パッケージのダウンロード URL は、
  [公式のアーカイブダウンロードページ] から辿ったものです。
* ダウンロードした deb パッケージはキャッシュしてみました。
* deb パッケージのインストール中に確認メッセージが出て止まらないように、
  `DEBIAN_FRONTEND=noninteractive` で抑えてます。

[公式のアーカイブダウンロードページ]: http://downloads.mysql.com/archives/community/

## DB アクセス情報

設定は CircleCI で用意されてたものが引き継がれたので、

* DB: `circle_test`
* ユーザ: `ubuntu`
* パスワード: なし

でアクセスできました。
新しい DB, ユーザを作るコマンドを組み込んでもいいと思う。

参考までに、 CircleCI で用意されてる DB の情報はこんな。

> Both postgresql and mysql are set up to use the ubuntu user,
> have a database called circle_test available, and don't require any password.
> The other databases should not need any specific username or password, and should just work.
>
> <footer><cite><a href="https://circleci.com/docs/environment">Test environment - CircleCI</a></cite></footer>

## コード

実際に CircleCI で回したコードと結果です。

* [akihyro/mysql56-in-circleci - GitHub](https://github.com/akihyro/mysql56-in-circleci)
* [akihyro/mysql56-in-circleci - CircleCI](https://circleci.com/gh/akihyro/mysql56-in-circleci/9)

## 参考

* [CircleCI で MySQL 5.6 を使う方法 - リア充爆発日記](http://ria10.hatenablog.com/entry/20150217/1424135330)
* [Want to use MySQL 5.6 at CircleCI? (Faster version) - Qiita](http://qiita.com/k12u/items/e00870174ec63489f2b0)
* [Installing MySQL on Linux Using Debian Packages from Oracle - MySQL 5.6 Reference Manual](http://dev.mysql.com/doc/refman/5.6/en/linux-installation-debian.html)
* [How do I use mysql 5.6? - CircleCI](https://circleci.com/docs/faq#how-do-i-use-mysql-5-6-)
* [Test environment - CircleCI](https://circleci.com/docs/environment)
