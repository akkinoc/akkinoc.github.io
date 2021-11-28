---
title: AWS - CloudFront アクセスログを Athena + Partition Projection で解析
categories: tech
tags: aws amazon-cloudfront amazon-athena aws-glue aws-cloudformation
header:
  teaser: /assets/posts/2021-11-29-aws-cloudfront-access-logs-with-athena-partition-projection-1200x630.png
  og_image: /assets/posts/2021-11-29-aws-cloudfront-access-logs-with-athena-partition-projection-1200x630.png
---

CloudFront のアクセスログを Athena で集計できる環境を作ったので、やり方を残しておきます。

アクセスログが溜まってもスキャンするデータ量を抑えるよう、パーティション分割もしました。
パーティション分割には、昨年追加された機能 "Partition Projection" を使ってみました。

<!--more-->

環境を再現できるように、 CloudFormation のテンプレートも公開しています。

## 要件と経緯

*他社から大量のイベントデータを HTTP GET で受け取って、それを集計したい！*

という要件が出てきたのが発端でした。

本当なら Kinesis Data Streams などリアルタイム処理も試してみたかったのですが、
とても納期が短かったので、経験のあった CloudFront と Athena で簡単に実現しました。

仕組みとデータフローは、こんな流れです。

1. 他社システムから CloudFront へ、イベントデータが HTTP GET で届く
2. CloudFront から S3 へ、アクセスログをイベントデータとして溜め込む
3. S3 から Athena で集計して、 BI ツールなど別の場所へアウトプットする

CloudFront 接続元の正当性は、固定 IP アドレスで確認します。
今回はテスト用のアクセスも確認できるよう Athena 集計時に除外しましたが、
WAF 等で第三者はアクセス不可にするのもアリだと思います。

この記事ではイベントデータの受信と集計に応用しましたが、
シンプルに Web アクセスログの集計にも使える内容です。

## Athena Partition Projection

アクセスログが溜まるとスキャンするデータ量の増大によって
集計時間や料金も増えてしまうので、日時でパーティション分割しました。

これまでだと `ALTER TABLE ADD PARTITION` や `MSCK REPAIR TABLE` で
事前にパーティションを追加する必要がありましたが、
"Partition Projection" という機能を使うと不要になりました。

ただ、 CloudFront が S3 に出力するパスそのままだと Partition Projection を適用できないため、
S3 ObjectCreated イベントをトリガーに Lambda でパスを移動するようにしました。
移動先パスの `dt=YYYY-MM-DD-HH` の部分がパーティションキーになります。

* 移動元: `<OPTIONAL-PREFIX>/<DISTRIBUTION-ID>.YYYY-MM-DD-HH.<UNIQUE-ID>.gz`
* 移動先: `<OPTIONAL-PREFIX>/dt=YYYY-MM-DD-HH/<DISTRIBUTION-ID>.YYYY-MM-DD-HH.<UNIQUE-ID>.gz`

Lambda のコードは、 AWS 公式のサンプルを拝借し、移動先パスだけ調整しました。
year/month/day/hour 列に分ける形で良ければ、そのままでも良いと思います。
僕は列 1 つの方がクエリで範囲指定しやすかったので、文字列型の dt 列だけにしました。

* [aws-samples/amazon-cloudfront-access-logs-queries/functions/moveAccessLogs.js](https://github.com/aws-samples/amazon-cloudfront-access-logs-queries/blob/cb92ccd979b2fdb1ae81339352399da5b8bb7e63/functions/moveAccessLogs.js)

```diff
- const targetKey = `${targetKeyPrefix}year=${year}/month=${month}/day=${day}/hour=${hour}/${filename}`;
+ const targetKey = `${targetKeyPrefix}dt=${year}-${month}-${day}-${hour}/${filename}`;
```

あとは、パーティションのキーとパラメータを与えてテーブル作成すれば、
Partition Projection を適用できました。

```sql
CREATE EXTERNAL TABLE IF NOT EXISTS cloudfront_accesslogs (
  `date` DATE,
  time STRING,
  x_edge_location STRING,
  sc_bytes BIGINT,
  c_ip STRING,
  cs_method STRING,
  cs_host STRING,
  cs_uri_stem STRING,
  sc_status INT,
  cs_referer STRING,
  cs_user_agent STRING,
  cs_uri_query STRING,
  cs_cookie STRING,
  x_edge_result_type STRING,
  x_edge_request_id STRING,
  x_host_header STRING,
  cs_protocol STRING,
  cs_bytes BIGINT,
  time_taken FLOAT,
  x_forwarded_for STRING,
  ssl_protocol STRING,
  ssl_cipher STRING,
  x_edge_response_result_type STRING,
  cs_protocol_version STRING,
  fle_status STRING,
  fle_encrypted_fields STRING,
  c_port INT,
  time_to_first_byte FLOAT,
  x_edge_detailed_result_type STRING,
  sc_content_type STRING,
  sc_content_len BIGINT,
  sc_range_start BIGINT,
  sc_range_end BIGINT
)
PARTITIONED BY (
  `dt` string                                     -- 日時パーティションキー (Lambda で移動後のパスに含まれる値)
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
LOCATION 's3://<BUCKET-NAME>/<OPTIONAL-PREFIX>/'  -- Lambda で移動後のパス
TBLPROPERTIES (
  'skip.header.line.count' = '2',
  'projection.enabled' = 'true',                  -- ここで Partition Projection を有効化
  'projection.dt.type' = 'date',                  -- 以下は型, フォーマット, 範囲等の設定
  'projection.dt.format' = 'yyyy-MM-dd-HH',       --
  'projection.dt.range' = '2021-10-31-15,NOW',    --
  'projection.dt.interval' = '1',                 --
  'projection.dt.interval.unit' = 'hours'         --
)
```

## Athena 集計クエリの例

例えば、日付 (JST), 接続元 IP アドレス, メソッド, パス, クエリ, ステータスごとに、
直近 3 か月間のリクエスト数を集計するなら、こんな感じでいけました。
パスやクエリは URL エンコードされてるので、雑にデコードしてます。

```sql
SELECT
  DATE(
    FROM_ISO8601_TIMESTAMP(
      CONCAT(TO_ISO8601(date), 'T', time, 'Z')
    ) AT TIME ZONE 'Asia/Tokyo'
  ) date,
  c_ip client,
  cs_method method,
  URL_DECODE(URL_DECODE(cs_uri_stem)) path,
  URL_DECODE(URL_DECODE(cs_uri_query)) query,
  sc_status status,
  COUNT(*) events
FROM
  cloudfront_accesslogs
WHERE
  dt >= FORMAT_DATETIME(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' - INTERVAL '3' MONTH, 'yyyy-MM-dd-HH')
GROUP BY
  1, 2, 3, 4, 5, 6
ORDER BY
  1, 2, 3, 4, 5, 6
```

## CloudFormation テンプレート

上記環境を構築できる CloudFormation テンプレートも作成しました。
GitHub に置いてます。

* [akkinoc/try-aws-cloudfront-access-logs-with-athena-partition-projection - GitHub](https://github.com/akkinoc/try-aws-cloudfront-access-logs-with-athena-partition-projection)

こちらのコマンドで "store.yml" を構築すると、

```console
$ aws cloudformation deploy \
  --template-file store.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --stack-name cflogs-store \        # stack-name と、
  --parameter-overrides Name=cflogs  # Name パラメータを切り替えれば、複数構築できます
```

ざっくり次のリソースが出来上がります。

* S3 バケット: `cflogs-store`
  * ログを溜め込むバケット
* Lambda 関数: `cflogs-store-events`
  * `s3://cflogs-store/new-events/` にログ配置されたら起動
  * `s3://cflogs-store/events/dt=YYYY-MM-DD-HH/` にログを移動
* Glue テーブル: `cflogs.events`
  * `s3://cflogs-store/events/dt=YYYY-MM-DD-HH/` を Partition Projection で反映

あとは CloudFront 側で `s3://cflogs-store/new-events/` に
アクセスログを出力するよう設定すれば完成です。
