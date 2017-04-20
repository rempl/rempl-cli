[![NPM version](https://img.shields.io/npm/v/rempl-cli.svg)](https://www.npmjs.com/package/rempl-cli)

# rempl-cli

Command line app to launch rempl server instance.

## Install
1. There are 2 options. You could install package globally
```
npm install -g rempl-cli
```
2. Or locally
```
npm install -D rempl-cli
```
## Usage

Start a server

```
rempl
```

That's it!

Options:

```
> rempl -h
Launch rempl server

Usage:

  rempl [options]

Options:

      --dev                Developer mode (use dev version of everything when possible)
  -h, --help               Output usage information
      --no-color           Suppress color output
  -p, --port <n>           Listening port (default 8177)
      --ssl                Enable https
      --ssl-cert <path>    Path to SSL .cert file
      --ssl-key <path>     Path to SSL .key file
  -v, --version            Output version
```
