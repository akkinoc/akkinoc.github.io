---
title: Sublime Text 3 のプラグインと設定を Git で共有してみた
categories: tech
tags: sublime-text git
header:
  teaser: /assets/posts/2014-11-16-sublime-git-800x200.jpg
---

複数の PC で Sublime Text 3 を同じように使いたくて、
プラグインと設定を Git で共有するようにしたった。
参考リンク含めてメモ。

<!--more-->

## 設定ファイルのある場所と使い方

自分は Windows ユーザなのでここ。

```text
C:\Users\{ユーザ名}\AppData\Roaming\Sublime Text 3
```

ここにローカルリポジトリ作って、設定変更したら `git commit & push` してる。
別の PC では `git pull` してから Sublime Text を起動。

## 管理すべきファイル

基本的には `Packages/User/` を管理すれば OK っぽい。

ただこのファイルたちは共有しない方がいいみたい。

* Package Control.last-run
* Package Control.ca-list
* Package Control.ca-bundle
* Package Control.system-ca-bundle
* Package Control.cache/
* Package Control.ca-certs/

## .gitignore

んで出来た `.gitignore` はこれ。

[Japanize] のファイルも管理する為、 `/Packages/Default/` も管理対象に含めてる。
あと `encoding_cache.json` は [ConvertToUTF8] のキャッシュっぽいので除外。

[Japanize]: https://github.com/kik0220/sublimetext_japanize
[ConvertToUTF8]: https://github.com/seanliang/ConvertToUTF8

```text
/*/
!/Packages/
/Packages/*
!/Packages/Default/
!/Packages/User/
/Packages/User/encoding_cache.json
/Packages/User/Package Control.cache/
/Packages/User/Package Control.ca-bundle
/Packages/User/Package Control.ca-certs/
/Packages/User/Package Control.ca-list
/Packages/User/Package Control.last-run
/Packages/User/Package Control.system-ca-bundle
```

## 自分の設定をさらしてみる

[akihyro/sublime-text-settings - GitHub](https://github.com/akihyro/sublime-text-settings)

## 参考

* [SublimeText の設定を git 管理し、複数 PC で設定やパッケージを同期する。 - MANA-DOT](http://blog.manaten.net/entry/sublimetext-git)
* [SublimeText2 - Sublime Text2,3 の Dropbox, Git を使った同期の方法 - Qiita](http://qiita.com/matsu_chara/items/b58564bba37e81637057)
* [Syncing - Package Control](https://sublime.wbond.net/docs/syncing)
