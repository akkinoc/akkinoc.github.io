---
title: AWS Batch ジョブを GAS (Google Apps Script) から直接投入する
categories: tech
tags: aws-batch google-apps-script aws google
header:
  teaser: /assets/posts/2022-06-10-aws-batch-submit-job-from-google-apps-script-1200x630.png
  og_image: /assets/posts/2022-06-10-aws-batch-submit-job-from-google-apps-script-1200x630.png
---

AWS Batch ジョブを GAS (Google Apps Script) から直接投入するためのメモ。

<!--more-->

## 前提

今回も先日の記事に書いた方法を使う。

[AWS API を GAS (Google Apps Script) から直接呼び出す]({% post_url 2022-05-15-aws-api-from-google-apps-script %})

AWS Batch のジョブ定義, ジョブキュー, コンピューティング環境は既にある前提。

## IAM ユーザ

GAS から AWS API を呼び出すための IAM ユーザを作成し、アクセスキーを発行する。

ポリシーはこんな感じで `batch:SubmitJob` だけ許可すれば OK。
アクセスキーは GAS にベタ書きしちゃうので、対象リソースをしっかり制限しとく。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "batch:SubmitJob",
      "Resource": [
        "arn:aws:batch:ap-northeast-1:178282380061:job-definition/{ジョブ定義名}",
        "arn:aws:batch:ap-northeast-1:178282380061:job-queue/{ジョブキュー名}"
      ]
    }
  ]
}
```

## GAS

発行したアクセスキーで `AWS.init` して、次のように `AWS.request` すれば OK。

```javascript
function DynamoDBPutItem() {
  const res = AWS.request(
    'batch',
    'ap-northeast-1',
    'SubmitJob',
    {},
    'POST',
    {
      jobName: '{ジョブ名}',
      jobDefinition: '{ジョブ定義名}',
      jobQueue: '{ジョブキュー名}',
      parameters: {
        '{パラメータ名}': '{パラメータ値}',
      },
    },
    { 'Content-Type': 'application/json' },
    '/v1/submitjob',
  )
  const code = res.getResponseCode()
  const text = res.getContentText()
  if (code < 200 || code >= 300) throw Error(`AWS.request failed: ${code} - ${text}`)
  Logger.log(`OK: ${table} - ${JSON.stringify(item)}`)
}
```
