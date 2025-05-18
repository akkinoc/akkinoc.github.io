---
title: 複数の PostgreSQL スキーマで開発するために検証したことメモ (Server Side Kotlin 向け)
categories: tech
tags: postgres kotlin docker gradle flyway jooq tbls
header:
  teaser: /assets/posts/2025-05-18-try-flyway-with-postgres-multi-schemas-1200x630.png
  og_image: /assets/posts/2025-05-18-try-flyway-with-postgres-multi-schemas-1200x630.png
---

サーバーサイド Kotlin のプロジェクトで、
複数の PostgreSQL スキーマで開発するために検証したことのメモです。

<!--more-->

検証用なのでコードの細かいとこは雑です。
他のやり方もあると思うので対応例の１つです。

## 検証に使ったコード

[akkinoc/try-flyway-with-postgres-multi-schemas - GitHub]

[akkinoc/try-flyway-with-postgres-multi-schemas - GitHub]: https://github.com/akkinoc/try-flyway-with-postgres-multi-schemas

## PostgreSQL の Docker コンテナを複数スキーマがある状態で起動するには？

スキーマ作成する初期化スクリプト (`/docker-entrypoint-initdb.d`) をマウントすれば良い。

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15.12-alpine
    environment:
      POSTGRES_USER: akkinoc
      POSTGRES_PASSWORD: akkinoc-pw
      POSTGRES_DB: akkinoc-db
    ports:
      - 15432:5432
    volumes:
      - ./postgres/init:/docker-entrypoint-initdb.d  # ここに仕込む
```

```sql
-- postgres/init/create-schemas.sql
CREATE SCHEMA schema1;
CREATE SCHEMA schema2;
CREATE SCHEMA schema3;
```

```sh
# PostgreSQL 起動
docker compose -f ./docker/docker-compose.yml up
```

## Flyway によるマイグレーションを Gradle でスキーマ別に管理するには？

スキーマの数だけ Gradle モジュールを作れば良い。

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.25"
    id("org.flywaydb.flyway") version "10.20.1"
}
buildscript {
    dependencies {
        classpath("org.flywaydb:flyway-database-postgresql:10.20.1")
    }
}
dependencies {
    compileOnly("org.postgresql:postgresql:42.7.5")
}
flyway {
    url = "jdbc:postgresql://localhost:15432/akkinoc-db"
    user = "akkinoc"
    password = "akkinoc-pw"
    defaultSchema = "schema1"  // ここでスキーマを指定
    cleanDisabled = false
}
```

```sh
# マイグレーション実行
gradle flywayClean flywayMigrate flywayInfo
```

## jOOQ で DB アクセス用コードを Gradle でスキーマ別に生成するには？

Server Side Kotlin から DB アクセスには jOOQ を使う。そのためのコード生成。
スキーマの数だけ Gradle モジュールに設定を仕込めば良い。
スキーマの情報も生成されたコードに含まれている。

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.25"
    id("org.flywaydb.flyway") version "10.20.1"
    id("org.jooq.jooq-codegen-gradle") version "3.19.21"
}
buildscript {
    dependencies {
        classpath("org.flywaydb:flyway-database-postgresql:10.20.1")
    }
}
dependencies {
    compileOnly("org.postgresql:postgresql:42.7.5")
    jooqCodegen("org.postgresql:postgresql:42.7.5")
}
flyway {
    url = "jdbc:postgresql://localhost:15432/akkinoc-db"
    user = "akkinoc"
    password = "akkinoc-pw"
    defaultSchema = "schema1"
    cleanDisabled = false
}
jooq {
    configuration {
        jdbc {
            url = "jdbc:postgresql://localhost:15432/akkinoc-db"
            user = "akkinoc"
            password = "akkinoc-pw"
        }
        generator {
            name = "org.jooq.codegen.KotlinGenerator"
            database {
                name = "org.jooq.meta.postgres.PostgresDatabase"
                inputSchema = "schema1"  // ここでスキーマを指定
                includes = ".*"
                excludes = "flyway_schema_history"
            }
            target {
                packageName = "dev.akkinoc.try_flyway_with_postgres_multi_schemas.schema1"
                directory = "src/main/kotlin"
            }
        }
    }
}
```

```sh
# jOOQ コード生成
gradle jooqCodegen
```

## tbls doc で複数スキーマの ER 図を作るには？

[tbls] は ER 図をリバース生成できるツール。
複数スキーマに対応されているので、普通に使うだけで良い。
スキーマ指定しなくても全スキーマ分が生成される。

[tbls]: https://github.com/k1LoW/tbls

```sh
# ER 図を生成
tbls doc postgresql://akkinoc:akkinoc-pw@localhost:15432/akkinoc-db?sslmode=disable
```
