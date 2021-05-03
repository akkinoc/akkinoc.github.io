---
title: CircleCI - Docker で MySQL の好きなバージョンを動かす
categories: tech
tags: circleci docker mysql
header:
  teaser: /assets/posts/2016-03-15-mysql-in-circleci-800x300.jpg
  overlay_image: /assets/posts/2016-03-15-mysql-in-circleci-800x300.jpg
  caption: Photo by [すしぱく](https://www.pakutaso.com/20110533134post-110.html)
---

CircleCI に入ってる MySQLは 5.5 です。古いです。
この記事では、 CircleCI の Docker を使って、 MySQL 5.6, 5.7 を動かしてみました。

<!--more-->

## circle.yml

`machine.services` で Docker を使えるようにします。

```yaml
machine:
  services:
    - "docker"
```

`dependencies` あたりで MySQL を起動します。

```yaml
dependencies:
  override:
    - docker run --detach --publish {port}:3306 --env MYSQL_ALLOW_EMPTY_PASSWORD=yes mysql:{version}
    - mysqladmin --host=127.0.0.1 --port={port} --user=root --wait ping
```

* `{version}` の部分には、使うバージョンのタグ (`5.6`, `5.7.11`, `latest` 等) を指定します。
  * タグは [mysql - Docker Hub] から確認できました。
  * マイナーバージョンまで細かく指定出来て良いです。
* `{port}` の部分には、接続するときのポート番号を指定します。
  * CircleCI では既に MySQL が動いてるので、 `3306` は使えませんでした。
* `MYSQL_ALLOW_EMPTY_PASSWORD=yes` で root パスワードはなしにしてます。
  * 必要なら `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD` 等を使うと良さそう。
* `mysqladmin ping` が通るまで待機してます。
  * `docker run` だけだと即座に接続できないことがあったので。
  * `--wait` オプションで失敗してもリトライしてくれるようです。
* `--host` は `localhost` ではなく IP アドレス (`127.0.0.1`) を使ってます。
  * `localhost` だとソケット接続になってしまうようです。
  * `--protocol=tcp` オプションを使っても良いかも。

[mysql - Docker Hub]: https://hub.docker.com/r/library/mysql/tags/

あとは後続処理で自分用の DB やテーブルを作るなりテストするなり。
もし mysql コマンドで繋ぐなら、こんな感じで接続できました。

```yaml
test:
  override:
    - mysql --host=127.0.0.1 --port={port} --user=root --execute "select host, user from mysql.user"
```

## Docker 使わない版

以前こんな記事も書きました。

[CircleCI で MySQL 5.6.23 を使う (現 Amazon RDS の最新版と同じバージョン)]({% post_url 2015-10-21-mysql56-in-circleci %})

この記事では、既存の 5.5 をアンインストールしてから、
localhsot に 好みのバージョンをインストールするようにしてました。
これだと CircleCI の既存の状態を意識しないといけなかったり、
5.7 にしようとしたら既存データのアップグレード等が発生したりで面倒でした...

今回の Docker なら、タグを書き換えるだけなので楽ちんです。

## コード

実際に CircleCI で回したコードと結果です。
5.6, 5.7 の2つを起動して、それぞれのバージョン, DB, ユーザを出力しました。

* [akihyro/mysql-in-circleci - GitHub](https://github.com/akihyro/mysql-in-circleci)
* [akihyro/mysql-in-circleci - CircleCI](https://circleci.com/gh/akihyro/mysql-in-circleci/13)
