## If you are in Mainland China

```sh
alias pnpm=pnpm --registry="http://mirrors.cloud.tencent.com/npm/"
```

# Install packages

```sh
pnpm i
```

# Install browser (optional)

```sh
pnpm exec playwright install chromium
```

# Run with

```sh
export CDP_PORT=9222
chrome --remote-debugging-port=$CDP_PORT --user-data-dir=$(mktemp -d) --no-first-run
pnpm start
```
