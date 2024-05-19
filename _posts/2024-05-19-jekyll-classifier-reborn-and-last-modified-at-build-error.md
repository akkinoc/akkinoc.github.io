---
title: Blog (Jekyll) を久々にビルドしたら classifier-reborn, jekyll-last-modified-at がエラーになったので解消した
categories: tech
tags: blog website jekyll ruby
header:
  teaser: /assets/posts/2024-05-19-jekyll-classifier-reborn-and-last-modified-at-build-error-1200x630.png
  og_image: /assets/posts/2024-05-19-jekyll-classifier-reborn-and-last-modified-at-build-error-1200x630.png
---

この Blog ([Jekyll]) を久々にビルドしたところ、
依存ライブラリ [classifier-reborn] ([gsl]), [jekyll-last-modified-at] ([posix-spawn]) の
インストールに失敗したので解消しました。

[Jekyll]: https://jekyllrb.com/
[classifier-reborn]: https://jekyll.github.io/classifier-reborn/
[gsl]: https://rubygems.org/gems/gsl
[jekyll-last-modified-at]: https://github.com/gjtorikian/jekyll-last-modified-at
[posix-spawn]: https://rubygems.org/gems/posix-spawn

<!--more-->

## 前提

この Blog はこんな Gemfile で依存ライブラリを管理しています。

```text
source "https://rubygems.org"
gem "jekyll", "~> 4.3"
gem "classifier-reborn", "~> 2.3"
gem "gsl", "~> 2.1"
# ... (中略)
group :jekyll_plugins do
  gem "jekyll-last-modified-at", "~> 1.3"
  # ... (中略)
end
```

公開する静的コンテンツは、次のコマンドでビルドしています。

```console
$ bundle install
$ bundle exec jekyll build
```

ビルド環境は次の通りです。

* macOS Sonoma 14.4.1 (M1)
* Ruby 3.3.1
* Bundler 2.5.9

## classifier-reborn (gsl)

### classifier-reborn とは

[classifier-reborn] は、 [Jekyll] で関連記事 (各記事ページの下部に表示しているリンク) の
リストを作るために必要な依存ライブラリです。
[Jekyll Build Command Options] の `lsi` を有効にする場合に必要となります。
また、これ単体だとコンテンツのビルドが非常に遅く、
高速化のため [gsl] も組み合わせて使っていました。

[Jekyll Build Command Options]: https://jekyllrb.com/docs/configuration/options/#build-command-options

### ビルドエラー

これを `bundle install` したところ、次のエラーが出ました。

```console
$ bundle install
# ... (中略)
Gem::Ext::BuildError: ERROR: Failed to build gem native extension.

    current directory: /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/gems/gsl-2.1.0.3/ext/gsl_native
/Users/username/.rbenv/versions/3.3.1/bin/ruby extconf.rb
checking gsl version... 2.7.1
checking gsl cflags... -I/opt/homebrew/Cellar/gsl/2.7.1/include
checking gsl libs... -L/opt/homebrew/Cellar/gsl/2.7.1/lib -lgsl -lgslcblas
checking for round()... yes
checking for alf/alf.h... no
checking for qrngextra/qrngextra.h... no
checking for rngextra/rngextra.h... no
checking for tensor/tensor.h... no
checking for gsl/gsl_multimin_fsdf.h... no
checking for gsl/gsl_cqp.h... no
checking for jacobi.h... no
checking for ndlinear/gsl_multifit_ndlinear.h... no
checking for ool/ool_version.h... no
checking for gsl_eigen_francis() in -lgsl... yes
checking for gsl_eigen_francis()... yes
checking for gsl_poly_solve_quartic() in -lgsl... no
checking for graph... no
checking for tamu_anova/tamu_anova.h... no
checking for gsl_multifit_fdfsolver.J in gsl/gsl_multifit_nlin.h... no
checking for gsl_sf_mathieu_a_e() in gsl/gsl_sf_mathieu.h... yes
checking for gsl_sf_mathieu_b_e() in gsl/gsl_sf_mathieu.h... yes
checking for gsl_sf_mathieu_ce_e() in gsl/gsl_sf_mathieu.h... yes
checking for gsl_sf_mathieu_se_e() in gsl/gsl_sf_mathieu.h... yes
checking for gsl_sf_mathieu_Mc_e() in gsl/gsl_sf_mathieu.h... yes
checking for gsl_sf_mathieu_Ms_e() in gsl/gsl_sf_mathieu.h... yes
creating gsl_config.h
creating Makefile

current directory: /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/gems/gsl-2.1.0.3/ext/gsl_native
make DESTDIR\= sitearchdir\=./.gem.20240519-75606-orrbex sitelibdir\=./.gem.20240519-75606-orrbex clean

current directory: /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/gems/gsl-2.1.0.3/ext/gsl_native
make DESTDIR\= sitearchdir\=./.gem.20240519-75606-orrbex sitelibdir\=./.gem.20240519-75606-orrbex
compiling alf.c
compiling array.c
In file included from array.c:12:
In file included from ./include/rb_gsl_common.h:20:
/opt/homebrew/Cellar/gsl/2.7.1/include/gsl/gsl_version.h:18:9: warning: 'GSL_VERSION' macro redefined [-Wmacro-redefined]
#define GSL_VERSION "2.7.1"
        ^
<command line>:1:9: note: previous definition is here
#define GSL_VERSION 2.7.1
        ^
In file included from array.c:12:
./include/rb_gsl_common.h:29:1: error: unknown type name 'EXTERN'
EXTERN ID rb_gsl_id_beg, rb_gsl_id_end, rb_gsl_id_excl, rb_gsl_id_to_a;
^
./include/rb_gsl_common.h:29:10: error: expected ';' after top level declarator
EXTERN ID rb_gsl_id_beg, rb_gsl_id_end, rb_gsl_id_excl, rb_gsl_id_to_a;
         ^
         ;
./include/rb_gsl_common.h:352:1: error: unknown type name 'EXTERN'
EXTERN VALUE cGSL_Object;
^
./include/rb_gsl_common.h:352:13: error: expected ';' after top level declarator
EXTERN VALUE cGSL_Object;
            ^
            ;
In file included from array.c:13:
./include/rb_gsl_array.h:39:1: error: unknown type name 'EXTERN'
EXTERN VALUE cgsl_block, cgsl_block_int;
^
./include/rb_gsl_array.h:39:13: error: expected ';' after top level declarator
EXTERN VALUE cgsl_block, cgsl_block_int;
            ^
            ;
./include/rb_gsl_array.h:40:1: error: unknown type name 'EXTERN'
EXTERN VALUE cgsl_block_uchar;
^
./include/rb_gsl_array.h:40:13: error: expected ';' after top level declarator
EXTERN VALUE cgsl_block_uchar;
            ^
            ;
./include/rb_gsl_array.h:41:1: error: unknown type name 'EXTERN'
EXTERN VALUE cgsl_block_complex;
^
./include/rb_gsl_array.h:41:13: error: expected ';' after top level declarator
EXTERN VALUE cgsl_block_complex;
            ^
            ;
./include/rb_gsl_array.h:42:1: error: unknown type name 'EXTERN'
EXTERN VALUE cgsl_vector, cgsl_vector_complex;
^
./include/rb_gsl_array.h:42:13: error: expected ';' after top level declarator
EXTERN VALUE cgsl_vector, cgsl_vector_complex;
            ^
            ;
./include/rb_gsl_array.h:43:1: error: unknown type name 'EXTERN'
EXTERN VALUE cgsl_vector_col;
^
./include/rb_gsl_array.h:43:13: error: expected ';' after top level declarator
EXTERN VALUE cgsl_vector_col;
            ^
            ;
./include/rb_gsl_array.h:44:1: error: unknown type name 'EXTERN'
EXTERN VALUE cgsl_vector_col_view;
^
./include/rb_gsl_array.h:44:13: error: expected ';' after top level declarator
EXTERN VALUE cgsl_vector_col_view;
            ^
            ;
./include/rb_gsl_array.h:45:1: error: unknown type name 'EXTERN'
EXTERN VALUE cgsl_vector_complex_col;
^
./include/rb_gsl_array.h:45:13: error: expected ';' after top level declarator
EXTERN VALUE cgsl_vector_complex_col;
            ^
            ;
./include/rb_gsl_array.h:46:1: error: unknown type name 'EXTERN'
EXTERN VALUE cgsl_vector_complex_col_view;
^
fatal error: too many errors emitted, stopping now [-ferror-limit=]
1 warning and 20 errors generated.
make: *** [array.o] Error 1

make failed, exit code 2

Gem files will remain installed in /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/gems/gsl-2.1.0.3 for inspection.
Results logged to /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/extensions/arm64-darwin-23/3.3.0/gsl-2.1.0.3/gem_make.out

  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:125:in `run'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:51:in `block in make'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:43:in `each'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:43:in `make'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/ext_conf_builder.rb:42:in `build'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:193:in `build_extension'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:227:in `block in build_extensions'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:224:in `each'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:224:in `build_extensions'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/installer.rb:852:in `build_extensions'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/rubygems_gem_installer.rb:76:in `build_extensions'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/rubygems_gem_installer.rb:28:in `install'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/source/rubygems.rb:205:in `install'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/installer/gem_installer.rb:54:in `install'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/installer/gem_installer.rb:16:in `install_from_spec'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/installer/parallel_installer.rb:132:in `do_install'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/installer/parallel_installer.rb:123:in `block in worker_pool'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/worker.rb:62:in `apply_func'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/worker.rb:57:in `block in process_queue'
  <internal:kernel>:187:in `loop'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/worker.rb:54:in `process_queue'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/worker.rb:90:in `block (2 levels) in create_threads'

An error occurred while installing gsl (2.1.0.3), and Bundler cannot continue.

In Gemfile:
  gsl
```

### 解決方法

[classifier-reborn] の Dependencies 記載を読むと、
[gsl] は長いことメンテされておらず、 Ruby 3 にも追いついてないようです。
代わりに [Numo] という方が推奨されていたので、そちらに切り替えました。

> Note: The gsl gem is currently incompatible with Ruby 3.
> It is recommended to use Numo instead with Ruby 3.
>
> <footer><cite><a href="https://jekyll.github.io/classifier-reborn/#install-gsl-gem">Install GSL Gem
 - Classifier Reborn</a></cite></footer>

[Numo]: https://ruby-numo.github.io/narray/

手順としては、 [classifier-reborn] の Dependencies 記載に従って、
[gsl] の代わりに [Numo] をインストールすれば OK です。
なお macOS の場合は、 [Numo] のビルド時に lapack, openblas の
インストール先パスを `build.numo-linalg` 等で教えてやる必要があるようです。

```console
$ bundle remove gsl
$ brew uninstall gsl

$ brew install lapack openblas
$ bundle config --local build.numo-linalg \
    --with-lapack-lib="$(brew --prefix lapack)/lib" \
    --with-openblas-dir=$(brew --prefix openblas)
$ bundle add numo-linalg numo-narray
```

## jekyll-last-modified-at (posix-spawn)

### jekyll-last-modified-at とは

[jekyll-last-modified-at] は、 [Jekyll] で記事の最終更新日時 (`page.last_modified_at`) を
Git コミットログから自動で設定してくれる依存ライブラリです。
内部で [posix-spawn] というライブラリに更に依存しているようです。

### ビルドエラー

これを `bundle install` したところ、次のエラーが出ました。

```console
$ bundle install
# ... (中略)
Gem::Ext::BuildError: ERROR: Failed to build gem native extension.

    current directory: /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/gems/posix-spawn-0.3.15/ext
/Users/username/.rbenv/versions/3.3.1/bin/ruby extconf.rb
creating Makefile

current directory: /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/gems/posix-spawn-0.3.15/ext
make DESTDIR\= sitearchdir\=./.gem.20240519-75606-7wjjb1 sitelibdir\=./.gem.20240519-75606-7wjjb1 clean

current directory: /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/gems/posix-spawn-0.3.15/ext
make DESTDIR\= sitearchdir\=./.gem.20240519-75606-7wjjb1 sitelibdir\=./.gem.20240519-75606-7wjjb1
compiling posix-spawn.c
posix-spawn.c:226:27: error: incompatible function pointer types passing 'int (VALUE, VALUE, posix_spawn_file_actions_t *)' (aka 'int (unsigned long, unsigned long, void **)')
to parameter of type 'int (*)(VALUE, VALUE, VALUE)' (aka 'int (*)(unsigned long, unsigned long, unsigned long)') [-Wincompatible-function-pointer-types]
        rb_hash_foreach(options, posixspawn_file_actions_operations_iter, (VALUE)fops);
                                 ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/Users/username/.rbenv/versions/3.3.1/include/ruby-3.3.0/ruby/internal/intern/hash.h:83:40: note: passing argument to parameter 'func' here
void rb_hash_foreach(VALUE hash, int (*func)(VALUE key, VALUE val, VALUE arg), VALUE arg);
                                       ^
1 error generated.
make: *** [posix-spawn.o] Error 1

make failed, exit code 2

Gem files will remain installed in /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/gems/posix-spawn-0.3.15 for inspection.
Results logged to /Users/username/akkinoc.github.io/vendor/bundle/ruby/3.3.0/extensions/arm64-darwin-23/3.3.0/posix-spawn-0.3.15/gem_make.out

  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:125:in `run'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:51:in `block in make'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:43:in `each'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:43:in `make'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/ext_conf_builder.rb:42:in `build'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:193:in `build_extension'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:227:in `block in build_extensions'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:224:in `each'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/ext/builder.rb:224:in `build_extensions'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/rubygems/installer.rb:852:in `build_extensions'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/rubygems_gem_installer.rb:76:in `build_extensions'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/rubygems_gem_installer.rb:28:in `install'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/source/rubygems.rb:205:in `install'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/installer/gem_installer.rb:54:in `install'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/installer/gem_installer.rb:16:in `install_from_spec'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/installer/parallel_installer.rb:132:in `do_install'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/installer/parallel_installer.rb:123:in `block in worker_pool'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/worker.rb:62:in `apply_func'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/worker.rb:57:in `block in process_queue'
  <internal:kernel>:187:in `loop'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/worker.rb:54:in `process_queue'
  /Users/username/.rbenv/versions/3.3.1/lib/ruby/3.3.0/bundler/worker.rb:90:in `block (2 levels) in create_threads'

An error occurred while installing posix-spawn (0.3.15), and Bundler cannot continue.

In Gemfile:
  jekyll-last-modified-at was resolved to 1.3.0, which depends on
    posix-spawn
```

### 解決方法

[posix-spawn] も長いことメンテされてないようですが、
[posix-spawn Issue #92 Comment] に回避方法がありました。

[posix-spawn Issue #92 Comment]: https://github.com/rtomayko/posix-spawn/issues/92#issuecomment-1993049841

次のビルドオプションを加えることで回避できました。

```console
$ bundle config --local build.posix-spawn \
    --with-cflags="-Wno-incompatible-function-pointer-types"
```
