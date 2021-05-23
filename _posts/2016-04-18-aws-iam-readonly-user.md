---
title: AWS - リードオンリーな IAM ユーザの作り方 (自分のユーザ情報だけは変更可)
categories: tech
tags: aws-iam aws
header:
  teaser: /assets/posts/2016-04-18-aws-iam-readonly-user-800x200.png
  og_image: /assets/posts/2016-04-18-aws-iam-readonly-user-800x200.png
---

読取り専用だけど、自分のパスワードやアクセスキー,
MFA (二段階認証) の設定だけはユーザ自身で出来る。

そんな IAM ユーザの作り方のメモです。
請求情報も参照できるポリシーも書きました。

<!--more-->

Management Console や API から自由に参照はしていいけど、
変更は許したくない、というユーザ用に。

## IAM グループの作成

この記事では IAM グループを作成し、そのグループにポリシーを与えていきます。

[IAM Management Console - グループ] からリードオンリー用のグループを作成します。
ここでは "Readonly" という名前でグループを作成しました。
ポリシーは後で追加していくので、まずは空っぽで。

[![Image: Group]][Image: Group]

次に [IAM Management Console - ユーザー] からユーザを作成し、
Readonly グループに加えます。

[![Image: User]][Image: User]

[IAM Management Console - グループ]: https://console.aws.amazon.com/iam/home?region=us-east-1#groups
[IAM Management Console - ユーザー]: https://console.aws.amazon.com/iam/home?region=us-east-1#users
[Image: Group]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image1-group-800x424.jpg %}
[Image: User]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image2-user-800x361.jpg %}

## グループに与える権限 (ポリシー)

以降、次のポリシーに分けてグループに追加していきます。
不要なものは読み飛ばしてください。

* 各サービスの情報の参照
* 請求情報の参照
* 自身のパスワードの変更 (認証情報ページからの変更)
* 自身のパスワードの変更 (ユーザーページからの変更)
* 自身のアクセスキーの変更
* 自身の MFA デバイスの変更
* 自身の SSH キーの変更

## 各サービスの情報の参照

管理ポリシー "ReadOnlyAccess" が用意されてるので、
それを Readonly グループに追加するだけで OK です。

[![Image: Readonly Policy]][Image: Readonly Policy]

[Image: Readonly Policy]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image3-readonly-policy-800x471.jpg %}

## 請求情報の参照

デフォルトでは IAM ユーザは請求情報にアクセスできなくなってるので、
まずはアクセス許可の設定をします。

ルートアカウントで [Billing Management Console - アカウント] を開き、
\[IAM アクセスのアクティブ化\] を ON にします。

[![Image: Billing Access]][Image: Billing Access]

[Billing Management Console - アカウント]: https://console.aws.amazon.com/billing/home#/account
[Image: Billing Access]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image4-billing-access-594x243.png %}

その後、 Readonly グループに次のインラインポリシーを追加すれば OK です。
僕は "PortalReadonlyAccess" という名前で追加しました。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "aws-portal:View*"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
```

[![Image: Portal Policy]][Image: Portal Policy]

[Image: Portal Policy]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image5-portal-policy-800x492.jpg %}

もし参照できる情報を制限したい場合は、試してないけど
`"aws-portal:View*"` の部分にワイルドカードを使わなければ良いと思う。

> **ViewBilling**
> 
> 次の \[Billing and Cost Management\] コンソールページを表示する権限を
> IAM ユーザーに与えるか拒否します。
> 
> * 請求ダッシュボード
> * 請求書
> * コストエクスプローラー
> * 予算
> * 支払履歴
> * 一括請求
> * 設定
> * Credits
> * 前払い（前払いの詳細については、「一括請求について」を参照してください。）
> 
> **ViewAccount**
> 
> アカウント設定を表示するアクセス権限を IAM ユーザーに与えるか拒否します。
> 
> **ViewBudget**
> 
> 予算を表示するアクセス権限を IAM ユーザーに与えるか拒否します。
> IAM ユーザーに予算の表示を許可するには、ViewBilling も許可する必要があります。
> 
> **ViewPaymentMethods**
> 
> 支払方法を表示するアクセス権限を IAM ユーザーに与えるか拒否します。
> 
> **ViewUsage**
> 
> AWS 使用状況レポートを表示するアクセス権限を IAM ユーザーに与えるか拒否します。
> IAM ユーザーが使用状況レポートを表示できるようにするには、
> ViewUsage と ViewBilling の両方を許可する必要があります。
>
> <footer><cite><a href="https://docs.aws.amazon.com/ja_jp/awsaccountbilling/latest/aboutv2/billing-permissions-ref.html">Billing and Cost Management の権限リファレンス - AWS 請求情報とコスト管理</a></cite></footer>

## 自身のパスワードの変更 (認証情報ページからの変更)

Management Console 右上メニュー \[[認証情報]\] からの変更を許可します。

[![Image: Auth Menu]][Image: Auth Menu]

[認証情報]: https://console.aws.amazon.com/iam/home#my_password
[Image: Auth Menu]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image6-auth-menu-333x356.jpg %}

デフォルトでは全てのユーザが自身のパスワードは
変更できるようになっているので、特にやることはありません。
もし一部のユーザのみ自身のパスワードを変更可にする場合は、
まずは [IAM Management Console - アカウント設定] で
\[ユーザーにパスワードの変更を許可\] をオフにします。

[IAM Management Console - アカウント設定]: https://console.aws.amazon.com/iam/home?region=us-east-1#account_settings

その後、 Readonly グループに次のインラインポリシーを追加すれば OK です。
僕は "MyPasswordAccess" という名前で追加しました。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:ChangePassword",
        "iam:GetAccountPasswordPolicy"
      ],
      "Resource": "*"
    }
  ]
}
```

[![Image: Password Policy]][Image: Password Policy]

[Image: Password Policy]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image7-password-policy-800x493.jpg %}

## 自身のパスワードの変更 (ユーザーページからの変更)

[ユーザページ] からの変更を許可します。

[ユーザページ]: https://console.aws.amazon.com/iam/home?region=us-east-1#users

Readonly グループに次のインラインポリシーを追加すれば OK です。
僕は "MyLoginProfileAccess" という名前で追加しました。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:*LoginProfile"
      ],
      "Resource": [
        "arn:aws:iam::*:user/${aws:username}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:ListAccount*",
        "iam:GetAccountSummary",
        "iam:GetAccountPasswordPolicy",
        "iam:ListUsers"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
```

[![Image: Login Policy]][Image: Login Policy]

[Image: Login Policy]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image8-login-policy-800x515.png %}

## 自身のアクセスキーの変更

Readonly グループに次のインラインポリシーを追加すれば OK です。
僕は "MyAccessKeyAccess" という名前で追加しました。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:*AccessKey"
      ],
      "Resource": [
        "arn:aws:iam::*:user/${aws:username}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:ListAccount*",
        "iam:GetAccountSummary",
        "iam:ListUsers"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
```

[![Image: Key Policy]][Image: Key Policy]

[Image: Key Policy]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image9-key-policy-800x506.png %}

## 自身の MFA デバイスの変更

Readonly グループに次のインラインポリシーを追加すれば OK です。
僕は "MyMFADeviceAccess" という名前で追加しました。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:*MFADevice"
      ],
      "Resource": [
        "arn:aws:iam::*:user/${aws:username}",
        "arn:aws:iam::*:mfa/${aws:username}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:ListAccount*",
        "iam:GetAccountSummary",
        "iam:ListUsers",
        "iam:ListMFADevices",
        "iam:ListVirtualMFADevices"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
```

[![Image: MFA Policy]][Image: MFA Policy]

[Image: MFA Policy]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image10-mfa-policy-800x537.png %}

## 自身の SSH キーの変更

Readonly グループに次のインラインポリシーを追加すれば OK です。
僕は "MySSHPublicKeyAccess" という名前で追加しました。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:*SSHPublicKey"
      ],
      "Resource": [
        "arn:aws:iam::*:user/${aws:username}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:ListAccount*",
        "iam:GetAccountSummary",
        "iam:ListUsers",
        "iam:ListSSHPublicKeys"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
```

[![Image: SSH Policy]][Image: SSH Policy]

[Image: SSH Policy]: {% link assets/posts/2016-04-18-aws-iam-readonly-user-image11-ssh-policy-1024x667.png %}

## 以上！

これで IAM ユーザをグループに加えたり外したりで管理できるようになりました！

## 参考

* [AWS Identity and Access Management](http://docs.aws.amazon.com/ja_jp/IAM/latest/UserGuide/introduction.html)
* [AWS 請求情報とコスト管理](https://docs.aws.amazon.com/ja_jp/awsaccountbilling/latest/aboutv2/billing-what-is.html)
* [[AWS] 閲覧のみ(Read Only) IAMユーザの作り方 - Developers.IO](http://dev.classmethod.jp/etc/create_readonly_iamuser/)
* [【IAM】リードオンリーのユーザーにパスワード変更を許可する方法について - Developers.IO](http://dev.classmethod.jp/cloud/aws/iam-allow-users-to-change-own-password/)

<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="//rcm-fe.amazon-adsystem.com/e/cm?lt1=_blank&bc1=000000&IS2=1&bg1=FFFFFF&fc1=000000&lc1=0000FF&t=akkinoc.dev-22&language=ja_JP&o=9&p=8&l=as4&m=amazon&f=ifr&ref=as_ss_li_til&asins=4822277372&linkId=58d993e8d919689e518b47783d17fdbe"></iframe>
<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="//rcm-fe.amazon-adsystem.com/e/cm?lt1=_blank&bc1=000000&IS2=1&bg1=FFFFFF&fc1=000000&lc1=0000FF&t=akkinoc.dev-22&language=ja_JP&o=9&p=8&l=as4&m=amazon&f=ifr&ref=as_ss_li_til&asins=4822277364&linkId=7760138a426630d8671941d0e89234a6"></iframe>
