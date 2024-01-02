# If you are in Mainland China

Use

```sh
pnpm --registry="http://mirrors.cloud.tencent.com/npm/"
```

instead of `pnpm` in the following commands.

# Install packages

```sh
pnpm i
```

Or better, use `pnpm` instaead of `npm`.

# Install browser

```sh
pnpm exec playwright install chromium
```

# Run with

```sh
chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-profile --no-first-run
pnpm start
```
