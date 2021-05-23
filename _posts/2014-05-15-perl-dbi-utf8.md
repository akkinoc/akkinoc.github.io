---
title: DBI (DBD::Oracle) で取得したデータの utf8 フラグをまとめて落とす
categories: tech
tags: perl oracle
header:
  teaser: /assets/posts/2014-05-15-perl-dbi-utf8-825x312.png
  og_image: /assets/posts/2014-05-15-perl-dbi-utf8-825x312.png
---

＊この記事は [Qiita](http://qiita.com/akihyro/items/8ac372ff6ce188e372be) から移行した内容です。

* DBI (DBD::Oracle) で取得したデータに utf8 フラグが付いてくる。
* 取得したデータは全て utf8 フラグなしで扱いたい。
* 全ての箇所に utf8 フラグ落とす処理を書くのは面倒。

というケースに使った。

<!--more-->

DBD::Oracle で utf8 フラグが付いてくる条件はこのあたり参照:

* [DBD::Oracle and Unicode - search.cpan.org](http://search.cpan.org/~pythian/DBD-Oracle-1.74/lib/DBD/Oracle.pm#DBD::Oracle_and_Unicode)

DBI のサブクラス化で対応した。
DBI のサブクラス化についてはこのあたり参照:

* [Subclassing the DBI - search.cpan.org](http://search.cpan.org/dist/DBI/DBI.pm#Subclassing_the_DBI)

## コード

### hoge.pl

```perl
#!/usr/bin/env perl

use strict;
use warnings;
use DBI;
use MySubDBI; # DBIサブクラス

my $dbh = DBI->connect("dbi:Oracle:localhost",
  "scott", "tiger", { RootClass => "MySubDBI" });
my $sth = $dbh->prepare("SELECT 'ほげ' AS HOGE FROM DUAL");
$sth->execute;
while (my $row = $sth->fetchrow_hashref) {
  print $row->{HOGE}."ほげ\n";
}
# => ほげほげ
```

### MySubDBI.pm

```perl
use strict;
use warnings;
use Encode;

package MySubDBI;
use base qw(DBI);

package MySubDBI::db;
use base qw(DBI::db);

package MySubDBI::st;
use base qw(DBI::st);

sub fetch {
  my ($self, @args) = @_;
  my $row = $self->SUPER::fetch(@args) || return;
  [ map { Encode::is_utf8($_) ? Encode::encode_utf8($_) : $_ } @$row ];
}

1;
```

## 元のコード (utf8 フラグがついてきてしまう版)

```perl
#!/usr/bin/env perl

use strict;
use warnings;
use DBI;

my $dbh = DBI->connect("dbi:Oracle:localhost", "scott", "tiger");
my $sth = $dbh->prepare("SELECT 'ほげ' AS HOGE FROM DUAL");
$sth->execute;
while (my $row = $sth->fetchrow_hashref) {
  print $row->{HOGE}."ほげ\n";
}
# => Wide character in print at ./hoge.pl line 11.
#    ほげã�»ã�� (文字化け)
```
