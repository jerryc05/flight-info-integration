## If you are in Mainland China
```sh
alias pnpm=pnpm --registry="http://mirrors.cloud.tencent.com/npm/"
```

# Install packages
```sh
pnpm i
```

# Install browser
```sh
pnpm exec playwright install chromium
```

# Run with
```sh
chrome --remote-debugging-port=9222 --user-data-dir=$(mktemp -d) --no-first-run
pnpm start
```
