---
title: Google スプレッドシートのテキストから Amazon Comprehend でキーフレーズを抽出
categories: tech
tags: google-sheets google-apps-script google amazon-comprehend aws nlp mecab
header:
  teaser: /assets/posts/2022-05-18-google-sheets-with-amazon-comprehend-1200x630.png
  og_image: /assets/posts/2022-05-18-google-sheets-with-amazon-comprehend-1200x630.png
---

大量にあるテキストからお手軽に単語を抽出したい、という要件が発生しまして。

結論、 Google スプレッドシートに入力したテキストから、
Amazon Comprehend でキーフレーズを抽出する仕組みを作った。

<!--more-->

## 要件

* 大量にあるテキストから単語を抽出したい。
* 非エンジニアが使うため、 CLI や API を直接は叩かない。
* UI 開発やサーバサイド開発は少なくお手軽に実現したい。

## mecab を試す (不採用)

自然言語処理は正直やったことなかったので、
真っ先に浮かんだのは形態素解析。
形態素解析と言えば mecab。

と言うことで試しにやってみた。
入力データは、僕の過去ツイートで試してみた。

```console
$ cat mecab-in.txt
Server-Side Kotlin Lounge #2「JavaからKotlinへの移行を考える」に参加を申し込みました！
AWS Batch 動く場所をEC2→Fargateに切り替え試してみてるけど、起動ちょっと早くなっていい感じ。
CloudFormationテンプレートを書くたび、YAMLアンカー/エイリアス機能くださいって思ってる。

$ mecab <mecab-in.txt
Server	名詞,固有名詞,組織,*,*,*,*
-	名詞,サ変接続,*,*,*,*,*
Side	名詞,一般,*,*,*,*,*
Kotlin	名詞,一般,*,*,*,*,*
Lounge	名詞,一般,*,*,*,*,*
#	名詞,サ変接続,*,*,*,*,*
2	名詞,数,*,*,*,*,*
「	記号,括弧開,*,*,*,*,「,「,「
Java	名詞,固有名詞,組織,*,*,*,*
から	助詞,格助詞,一般,*,*,*,から,カラ,カラ
Kotlin	名詞,固有名詞,組織,*,*,*,*
へ	助詞,格助詞,一般,*,*,*,へ,ヘ,エ
の	助詞,連体化,*,*,*,*,の,ノ,ノ
移行	名詞,サ変接続,*,*,*,*,移行,イコウ,イコー
を	助詞,格助詞,一般,*,*,*,を,ヲ,ヲ
考える	動詞,自立,*,*,一段,基本形,考える,カンガエル,カンガエル
」	記号,括弧閉,*,*,*,*,」,」,」
に	助詞,格助詞,一般,*,*,*,に,ニ,ニ
参加	名詞,サ変接続,*,*,*,*,参加,サンカ,サンカ
を	助詞,格助詞,一般,*,*,*,を,ヲ,ヲ
申し込み	動詞,自立,*,*,五段・マ行,連用形,申し込む,モウシコミ,モーシコミ
まし	助動詞,*,*,*,特殊・マス,連用形,ます,マシ,マシ
た	助動詞,*,*,*,特殊・タ,基本形,た,タ,タ
！	記号,一般,*,*,*,*,！,！,！
EOS
AWS	名詞,固有名詞,組織,*,*,*,*
Batch	名詞,一般,*,*,*,*,*
動く	動詞,自立,*,*,五段・カ行イ音便,基本形,動く,ウゴク,ウゴク
場所	名詞,一般,*,*,*,*,場所,バショ,バショ
を	助詞,格助詞,一般,*,*,*,を,ヲ,ヲ
EC	名詞,一般,*,*,*,*,*
2	名詞,数,*,*,*,*,*
→	記号,一般,*,*,*,*,→,→,→
Fargate	名詞,固有名詞,組織,*,*,*,*
に	助詞,格助詞,一般,*,*,*,に,ニ,ニ
切り替え	名詞,一般,*,*,*,*,切り替え,キリカエ,キリカエ
試し	動詞,自立,*,*,五段・サ行,連用形,試す,タメシ,タメシ
て	助詞,接続助詞,*,*,*,*,て,テ,テ
み	動詞,非自立,*,*,一段,連用形,みる,ミ,ミ
てる	動詞,非自立,*,*,一段,基本形,てる,テル,テル
けど	助詞,接続助詞,*,*,*,*,けど,ケド,ケド
、	記号,読点,*,*,*,*,、,、,、
起動	名詞,サ変接続,*,*,*,*,起動,キドウ,キドー
ちょっと	副詞,助詞類接続,*,*,*,*,ちょっと,チョット,チョット
早く	形容詞,自立,*,*,形容詞・アウオ段,連用テ接続,早い,ハヤク,ハヤク
なっ	動詞,自立,*,*,五段・ラ行,連用タ接続,なる,ナッ,ナッ
て	助詞,接続助詞,*,*,*,*,て,テ,テ
いい	形容詞,自立,*,*,形容詞・イイ,基本形,いい,イイ,イイ
感じ	名詞,一般,*,*,*,*,感じ,カンジ,カンジ
。	記号,句点,*,*,*,*,。,。,。
EOS
CloudFormation	名詞,固有名詞,組織,*,*,*,*
テンプレート	名詞,一般,*,*,*,*,テンプレート,テンプレート,テンプレート
を	助詞,格助詞,一般,*,*,*,を,ヲ,ヲ
書く	動詞,自立,*,*,五段・カ行イ音便,基本形,書く,カク,カク
たび	名詞,非自立,副詞可能,*,*,*,たび,タビ,タビ
、	記号,読点,*,*,*,*,、,、,、
YAML	名詞,固有名詞,組織,*,*,*,*
アンカー	名詞,一般,*,*,*,*,アンカー,アンカー,アンカー
/	名詞,サ変接続,*,*,*,*,*
エイリアス	名詞,一般,*,*,*,*,*
機能	名詞,サ変接続,*,*,*,*,機能,キノウ,キノー
ください	動詞,非自立,*,*,五段・ラ行特殊,命令ｉ,くださる,クダサイ,クダサイ
って	助詞,格助詞,連語,*,*,*,って,ッテ,ッテ
思っ	動詞,自立,*,*,五段・ワ行促音便,連用タ接続,思う,オモッ,オモッ
てる	動詞,非自立,*,*,一段,基本形,てる,テル,テル
。	記号,句点,*,*,*,*,。,。,。
EOS
```

とても細かく分解してくれた。
もしこれを使うなら、非エンジニアが使う UI を用意して、
裏で mecab を叩いて、固有名詞/一般名詞など必要そうな
単語だけ抽出したらいいだろうか。

## Amazon Comprehend を試す

そいえば AWS にも自然言語処理のサービスがあったな、
と思い出して Amazon Comprehend というサービスに行きつく。
マネコンに入るとリアルタイムに分析できた。便利。

[![Image: Amazon Comprehend Real-time analysis]][Image: Amazon Comprehend Real-time analysis]

[Image: Amazon Comprehend Real-time analysis]: {% link assets/posts/2022-05-18-google-sheets-with-amazon-comprehend-realtime-analysis-800x768.png %}

キーフレーズ検出なので mecab よりは荒いけど、いい感じ。
今回の要件にはこちらの方が合ってそうだったので、こちらを採用。

## GAS で Amazon Comprehend を呼ぶ

UI 開発, サーバサイド開発を省きたかったので、
テキストは Google スプレッドシートに入力してもらい、
GAS (Google Apps Script) で Amazon Comprehend を呼ぶことにした。
GAS から AWS API を直接呼び出す方法は前回の記事に書いた。

[AWS API を GAS (Google Apps Script) から直接呼び出す]({% post_url 2022-05-15-aws-api-from-google-apps-script %})

コードはこんな感じ (`AWS.init` は済んでる前提)。
ついでに DetectEntities (エンティティ検出) も書いておく。

```javascript
function detectKeyPhrases(lang, text) {
  var req = {
    service: "comprehend",
    region: "ap-northeast-1",
    action: "Comprehend_20171127.DetectKeyPhrases",
    method: "POST",
    params: {},
    headers: { "Content-Type": "application/x-amz-json-1.1" },
    payload: { LanguageCode: lang, Text: text },
  }
  var res = AWS.request(req.service, req.region, req.action, req.params, req.method, req.payload, req.headers)
  res = { code: res.getResponseCode(), headers: res.getHeaders(), payload: JSON.parse(res.getContentText()) }
  if (res.code < 200 || res.code >= 300)
    throw new Error("Amazon Comprehend DetectKeyPhrases failed: " + JSON.stringify(res))
  return res.payload
}

function detectEntities(lang, text) {
  var req = {
    service: "comprehend",
    region: "ap-northeast-1",
    action: "Comprehend_20171127.DetectEntities",
    method: "POST",
    params: {},
    headers: { "Content-Type": "application/x-amz-json-1.1" },
    payload: { LanguageCode: lang, Text: text },
  }
  var res = AWS.request(req.service, req.region, req.action, req.params, req.method, req.payload, req.headers)
  res = { code: res.getResponseCode(), headers: res.getHeaders(), payload: JSON.parse(res.getContentText()) }
  if (res.code < 200 || res.code >= 300)
    throw new Error("Amazon Comprehend DetectEntities failed: " + JSON.stringify(res))
  return res.payload
}
```

あとは以下を実装して、いい感じに
メニューからキーフレーズ分解を実行できるようにした。

1. `SpreadsheetApp.getUi().createMenu()` で以下を実行するメニューを追加。
2. スプレッドシートから入力されたテキストを拾う。
3. 上記の `detectKeyPhrases` に入力テキストを渡して呼ぶ。
4. 返ってきた結果 (キーフレーズ) をスプレッドシートに反映。

## 所感

自然言語処理、初めて使ってみたけども (だいぶ雑にしか触ってないけど)。
なかなか面白かったー。
