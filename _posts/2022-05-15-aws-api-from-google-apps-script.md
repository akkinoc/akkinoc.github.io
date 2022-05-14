---
title: AWS API を GAS (Google Apps Script) から直接呼び出す
categories: tech
tags: aws google google-apps-script google-sheets amazon-ec2 amazon-s3 amazon-dynamodb amazon-redshift
header:
  teaser: /assets/posts/2022-05-15-aws-api-from-google-apps-script-1200x630.png
  og_image: /assets/posts/2022-05-15-aws-api-from-google-apps-script-1200x630.png
---

AWS SDK は GAS (Google Apps Script) 向けには提供されていません。
AWS SDK for JavaScript も実行環境が異なるため使えません。

そんななか、割と簡単に AWS API を GAS (Google Apps Script) から
直接呼び出す方法を見つけました。

<!--more-->

## 背景

僕は最近、簡単な業務効率化ツールや、
UI 開発を省略したプロトタイプ版ツールなど、
Google スプレッドシートを入力データとして、
AWS と連携するツールを開発することが多いです。

簡単なツールやプロトタイプ版ツールの開発なので、
UI だけでなくサーバサイドの開発工数も極力省きたい。
そうすると、データ入力された Google スプレッドシートの
GAS から AWS API を直接呼び出したいケースが出てきました。

しかし、 AWS SDK は GAS 向けには提供されていませんし、
AWS SDK for JavaScript も実行環境が Node.js, Web ブラウザとは
異なるため使えません。
AWS API のリクエスト発行を自前で実装するにしても、
認証周り ([AWS API リクエストの署名]) がとても面倒そうです。

[AWS API リクエストの署名]: https://docs.aws.amazon.com/ja_jp/general/latest/gr/signing_aws_api_requests.html

この記事は、これを解決した内容になります。

## aws-apps-scripts

こちらを使わせてもらいました。面倒な認証周りをやってくれます。
(2019 年にはあったのですね。もっと早く見つけたかった・・・。)

[smithy545/aws-apps-scripts - GitHub](https://github.com/smithy545/aws-apps-scripts)

使い方はこんな感じ。シンプル。

1. GAS プロジェクト内に、上記 GitHub リポジトリの "aws.js" をコピー。
   (複数プロジェクトで使うならライブラリとして登録しても良さそう。)
2. `AWS.init(...)` を呼び出して初期設定。
3. `AWS.request(...)` で AWS API リクエストを発行。

> ```javascript
> function myFunction() {
>   AWS.init("MY_ACCESS_KEY", "MY_SECRET_KEY");
>   var instanceXML = AWS.request('ec2', 'us-east-1', 'DescribeInstances', {"Version":"2015-10-01"});
>   ...
> }
> ```

## AWS.request の引数

API によっては、 `AWS.request(...)` の引数に指定すべき値が
よく分からないことがありました。
そういう場合は、手元でデバッグフラグ (`--debug`) 付きで AWS CLI を叩くと
生の HTTP リクエスト/レスポンスまで見れるので、そこから推測できました。

例えば DynamoDB PutItem の場合、
[DynamoDB PutItem リファレンス] も参照しつつ、
以下のように `AWS.request(...)` の引数を特定できました。

[DynamoDB PutItem リファレンス]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html

```console
$ aws dynamodb put-item --table-name my_table --item '{ "id": { "S": "my-item" } }' --debug
...
2022-05-15 13:56:02,141 - MainThread - botocore.endpoint - DEBUG - Making request for OperationModel(name=PutItem) with params: {'url_path': '/', 'query_string': '', 'method': 'POST', 'headers': {'X-Amz-Target': 'DynamoDB_20120810.PutItem', 'Content-Type': 'application/x-amz-json-1.0', 'User-Agent': 'aws-cli/2.5.4 Python/3.9.12 Darwin/21.4.0 source/x86_64 prompt/off command/dynamodb.put-item'}, 'body': b'{"TableName": "my_table", "Item": {"id": {"S": "my-item"}}}', 'url': 'https://dynamodb.ap-northeast-1.amazonaws.com/', 'context': {'client_region': 'ap-northeast-1', 'client_config': <botocore.config.Config object at 0x1085820d0>, 'has_streaming_input': False, 'auth_type': None}}
...
```

| 引数          | 引数の値                                           | 引数の値の特定方法                          |
|---------------|----------------------------------------------------|---------------------------------------------|
| 1. サービス   | `dynamodb`                                         | ログ中の `url` のサブドメインを参照         |
| 2. リージョン | `ap-northeast-1`                                   | ログ中の `url` のサブドメインを参照         |
| 3. アクション | `DynamoDB_20120810.PutItem`                        | ログ中の `headers` の `X-Amz-Target` を参照 |
| 4. パラメータ | なし                                               | ログ中の `query_string` を参照 (多分)       |
| 5. メソッド   | `POST`                                             | ログ中の `method` を参照                    |
| 6. ペイロード | `{ TableName: ..., Item: ... }`                    | ログ中の `body` を参照                      |
| 7. ヘッダ     | `{ 'Content-Type': 'application/x-amz-json-1.0' }` | ログ中の `headers` の `Content-Type` を参照 |
| 8. パス       | なし (デフォルト: `/`)                             | ログ中の `url_path` を参照 (多分)           |

特に、 "3. アクション" は API のバージョン指定 (?) も含んでいるのか、
単純な API 名 (`PutItem`) だけだと通らなかったので注意です。
また、 "7. ヘッダ" には上記 `Content-Type` を指定しないと
HTTP 404 エラーになってしまったので、こちらも注意です。

## AWS.request の返却値

`AWS.request(...)` の返却値は [URL Fetch Service の HTTPResponse 型] でした。
成功/失敗は `getResponseCode()` (HTTP ステータスコード) で確認できました。
(HTTP 4xx, HTTP 5xx が発生しても例外はスローされません。)

[URL Fetch Service の HTTPResponse 型]: https://developers.google.com/apps-script/reference/url-fetch/http-response

## ex) EC2 DescribeInstances

EC2 インスタンス ID の一覧を出力する例です。
※ページングは考慮してません。件数が多いと一部しか出力されません。

```javascript
function EC2DescribeInstances() {
  const res = AWS.request(
    'ec2',
    'ap-northeast-1',
    'DescribeInstances',
    { Version: '2016-11-15' },
  )
  const code = res.getResponseCode()
  const text = res.getContentText()
  if (code < 200 || code >= 300) throw Error(`AWS.request failed: ${code} - ${text}`)
  const root = XmlService.parse(text).getRootElement()
  const ns = root.getNamespace()
  const reservations = root.getChild('reservationSet', ns).getChildren()
  reservations.forEach(reservation => {
    const instances = reservation.getChild('instancesSet', ns).getChildren()
    instances.forEach(instance => {
      const instanceId = instance.getChild('instanceId', ns)
      Logger.log(`OK: ${instanceId.getText()}`)
    })
  })
}
```

## ex) S3 PutObject

S3 にオブジェクトをアップロードする例です。

```javascript
function S3PutObject() {
  const bucket = 'my-bucket'
  const key = 'my-content.txt'
  const content = 'My Content'
  const res = AWS.request(
    's3',
    'ap-northeast-1',
    'PutObject',
    {},
    'PUT',
    content,
    { 'Content-Type': MimeType.PLAIN_TEXT },
    `/${key}`,
    { Bucket: bucket },
  )
  const code = res.getResponseCode()
  const text = res.getContentText()
  if (code < 200 || code >= 300) throw Error(`AWS.request failed: ${code} - ${text}`)
  Logger.log(`OK: ${bucket}/${key}`)
}
```

## ex) S3 GetObject

S3 からオブジェクトをダウンロードする例です。

```javascript
function S3GetObject() {
  const bucket = 'my-bucket'
  const key = 'my-content.txt'
  const res = AWS.request(
    's3',
    'ap-northeast-1',
    'GetObject',
    {},
    'GET',
    null,
    {},
    `/${key}`,
    { Bucket: bucket },
  )
  const code = res.getResponseCode()
  const text = res.getContentText()
  if (code < 200 || code >= 300) throw Error(`AWS.request failed: ${code} - ${text}`)
  Logger.log(`OK: ${bucket}/${key}\n${text}`)
}
```

## ex) DynamoDB PutItem

DynamoDB テーブルにアイテムを登録する例です。

```javascript
function DynamoDBPutItem() {
  const table = 'my_table'
  const item = { id: { S: 'my-item' } }
  const res = AWS.request(
    'dynamodb',
    'ap-northeast-1',
    'DynamoDB_20120810.PutItem',
    {},
    'POST',
    { TableName: table, Item: item },
    { 'Content-Type': 'application/x-amz-json-1.0' },
  )
  const code = res.getResponseCode()
  const text = res.getContentText()
  if (code < 200 || code >= 300) throw Error(`AWS.request failed: ${code} - ${text}`)
  Logger.log(`OK: ${table} - ${JSON.stringify(item)}`)
}
```

## ex) RedshiftData.ExecuteStatement

僕は試してないですが、こちらの記事が参考になりそうです。
(今回の AWS.request を見つけたキッカケになった記事です！)

[Roche が Google スプレッドシートと Amazon Redshift Data API で データへのアクセスを民主化した方法 - Amazon Web Services ブログ](https://aws.amazon.com/jp/blogs/news/how-roche-democratized-access-to-data-with-google-sheets-and-amazon-redshift-data-api/)

> ```javascript
> var resultJson = AWS.request(
>   getTypeAWS_(),
>   getLocationAWS_(),
>   'RedshiftData.ExecuteStatement',
>   {"Version": getVersionAWS_()},
>   method='POST',
>   payload={
>     "ClusterIdentifier": getClusterIdentifierReshift_(),
>     "Database": getDataBaseRedshift_(),
>     "DbUser": getDbUserRedshift_(),
>     "Sql": sql
>   },
>   headers={
>     "X-Amz-Target": "RedshiftData.ExecuteStatement",
>     "Content-Type": "application/x-amz-json-1.1"
>   }
> );
> ```

## 他の手段

下記の手段もあったので参考にリンクしておきます。
ただどれも制限があるので、用途によって使い分けたいところです。

### S3-for-Google-Apps-Script を使う方法

* [eschultink/S3-for-Google-Apps-Script - GitHub](https://github.com/eschultink/S3-for-Google-Apps-Script/)
* [Amazon S3 API Binding for Google Apps Script - Engineering Etc](https://engetc.com/projects/amazon-s3-api-binding-for-google-apps-script/)
* [Google Apps Script を利用して Google スプレッドシートのデータを S3 へ JSON として保存する - DevelopersIO](https://dev.classmethod.jp/articles/google-apps-script-gss-to-s3-json/)
* [GAS の新しいエディタで S3 ライブラリを使用する方法 - Qiita](https://qiita.com/GoeMon564/items/851b76a5c78b22a64fe2)

S3 にしか対応してないです。
インターフェイスがシンプルなので、 S3 だけ使う場合はこちらのが便利です。

### HtmlService 経由で AWS SDK for JavaScript を使う方法

* [Google Apps Script から AWS SDK for JavaScript を使って、スプレッドシートのデータを S3 にアップロードしてみた - DevelopersIO](https://dev.classmethod.jp/articles/uploaded-spreadsheet-data-to-s3-using-aws-sdk-for-javascript-from-google-apps-script/)

AWS SDK for JavaScript を使えるのは便利そうです。
ただ、 HtmlService でサブウィンドウを表示/経由する必要があり、
全体的には少し煩雑になりそうだったため、僕は試していません。
