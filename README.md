# Settings Toggler

Toggle and cycle any VS Code setting with keyboard shortcuts and status bar icons.

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/nnyj.settings-toggler?style=for-the-badge)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/nnyj.settings-toggler?style=for-the-badge)
![License](https://img.shields.io/github/license/nnyj/vscode-settings-toggler?style=for-the-badge)

## Features

- Toggle any setting with a keybinding or clickable status bar icon
- Cycle through 2+ values (not just on/off)
- Boolean settings auto-toggle without specifying values
- Toggle multiple settings together in one keybind
- Status bar icons show the current value at a glance
- Configurable icon placement (left/right side of status bar)
- Zero runtime dependencies, single file
- Workspace-aware: respects workspace vs global scope

## Usage

### Keybinding

Bind in `keybindings.json`:

```jsonc
// Boolean setting, auto-toggles true/false
{
  "key": "alt+r",
  "command": "settings.cycle",
  "args": {
    "id": "explorer.autoReveal"
  }
}
```

```jsonc
// Cycle through specific values
{
  "key": "alt+=",
  "command": "settings.cycle",
  "args": {
    "id": "fontSize",
    "values": [
      { "editor.fontSize": 14 },
      { "editor.fontSize": 16 },
      { "editor.fontSize": 20 }
    ]
  }
}
```

```jsonc
// Toggle multiple settings at once
{
  "key": "alt+z",
  "command": "settings.cycle",
  "args": {
    "id": "zen",
    "values": [
      { "editor.minimap.enabled": true, "breadcrumbs.enabled": true },
      { "editor.minimap.enabled": false, "breadcrumbs.enabled": false }
    ]
  }
}
```

### Status bar icons

Add to `settings.json` to show clickable toggle icons in the status bar:

```jsonc
"settings-toggler.statusBar": [
  {
    "property": "editor.codeLens",
    "icon": "eye",
    "label": "codeLens"
  },
  {
    "property": "editor.renderWhitespace",
    "icon": "whitespace",
    "values": ["none", "all"],
    "alignment": "left",
    "priority": 100
  },
  {
    "property": "explorer.autoReveal",
    "icon": "folder"
  }
]
```

Boolean settings auto-toggle without `values`. Non-boolean settings require explicit `values`.

Icons are [Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html). Each icon displays the current value, e.g. `$(eye) codeLens: true`.

### Pre-defined commands

Define cycles in `settings.json` to register named commands (`settings.cycle.<id>`):

```jsonc
"settings.cycle": [
  {
    "id": "minimap",
    "values": [
      { "editor.minimap.enabled": true },
      { "editor.minimap.enabled": false }
    ]
  }
]
```

Bind with:

```jsonc
{
  "key": "alt+m",
  "command": "settings.cycle.minimap"
}
```

## Status bar configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `property` | `string` | required | VS Code setting to toggle |
| `icon` | `string` | required | Codicon name |
| `label` | `string` | — | Label shown next to icon |
| `values` | `array` | — | Values to cycle. Optional for booleans |
| `alignment` | `"left"` \| `"right"` | `"right"` | Status bar side |
| `priority` | `number` | `0` | Position priority (higher = closer to edge) |

## Credits

Rewrite of [hoovercj/vscode-settings-cycler](https://github.com/hoovercj/vscode-api-playground/tree/master/SettingsCycler). Modernized for current VS Code API, added status bar icons, boolean auto-toggle, removed all runtime dependencies.

## License

[MIT](LICENSE)
