# stacksync

> A CLI tool to snapshot and restore local dev environment configs across machines using a simple YAML manifest.

---

## Installation

```bash
npm install -g stacksync
```

Or with pnpm:

```bash
pnpm add -g stacksync
```

---

## Usage

**Snapshot your current environment:**

```bash
stacksync snapshot --output ./stacksync.yml
```

**Restore from a manifest on a new machine:**

```bash
stacksync restore --from ./stacksync.yml
```

**Example `stacksync.yml` manifest:**

```yaml
version: 1
configs:
  - source: ~/.gitconfig
  - source: ~/.zshrc
  - source: ~/.config/nvim
tools:
  - name: node
    version: "20.11.0"
  - name: python
    version: "3.12.0"
```

Stacksync will diff your current environment against the manifest and apply only what's missing or outdated.

---

## Commands

| Command    | Description                              |
|------------|------------------------------------------|
| `snapshot` | Capture current config files and tools   |
| `restore`  | Apply a manifest to the current machine  |
| `diff`     | Preview changes before restoring         |

---

## License

[MIT](./LICENSE)