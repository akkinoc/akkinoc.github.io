# akkinoc.github.io

[![build badge]][build]
[![license badge]][license]
[![sponsor badge]][sponsor]

[build]: https://github.com/akkinoc/akkinoc.github.io/actions/workflows/build.yml
[build badge]: https://github.com/akkinoc/akkinoc.github.io/actions/workflows/build.yml/badge.svg
[license]: LICENSE.txt
[license badge]: https://img.shields.io/github/license/akkinoc/akkinoc.github.io?color=blue
[sponsor]: https://github.com/sponsors/akkinoc
[sponsor badge]: https://img.shields.io/static/v1?logo=github&label=sponsor&message=%E2%9D%A4&color=db61a2

The codebase for my personal website hosted on GitHub Pages: [akkinoc.dev]

[akkinoc.dev]: https://akkinoc.dev

## Setup

To setup, run:

```console
$ git clone git@github.com:akkinoc/akkinoc.github.io.git
$ cd akkinoc.github.io
$ brew install lapack openblas # for classifier-reborn
$ bundle install
```

## Building

To build, run:

```console
$ bundle exec jekyll build
```

## Running

To run on localhost, run:

```console
$ bundle exec jekyll serve --drafts --future
```

## Deploying

To deploy, push to the GitHub `main` branch.
It will be automatically deployed to [GitHub Pages][akkinoc.dev] via [GitHub Actions][build].

## License

Licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License][license].
