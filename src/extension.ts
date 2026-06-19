import { ExtensionContext, workspace, WorkspaceConfiguration, window, commands, Disposable, StatusBarItem, StatusBarAlignment } from 'vscode';

type Dict = Record<string, unknown>;

interface CycleArgs {
  id: string;
  values?: Dict[];
  overrideWorkspaceSettings?: boolean;
}

interface StatusBarConfig {
  property: string;
  icon: string;
  label?: string;
  values?: unknown[];
  alignment?: 'left' | 'right';
  priority?: number;
}

const enum Scope { Global, Workspace, None }

let customDisposables: Disposable[] = [];
let registeredCommands: CycleArgs[] = [];
let statusBarItems: StatusBarItem[] = [];
const indexCache: Record<string, number> = {};

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('settings.cycle', cycleSetting),
    workspace.onDidChangeConfiguration(() => {
      registerNamedCommands();
      updateStatusBarItems();
    }),
    { dispose: disposeAll }
  );
  registerNamedCommands();
  createStatusBarItems();
}

function resolveValues(args: CycleArgs): Dict[] {
  if (args.values?.length) return args.values;
  const info = workspace.getConfiguration().inspect(args.id);
  if (info?.defaultValue !== undefined && typeof info.defaultValue === 'boolean') {
    return [{ [args.id]: true }, { [args.id]: false }];
  }
  window.showErrorMessage(`Settings Toggler: "${args.id}" is not boolean, specify "values" explicitly.`);
  return [];
}

function cycleSetting(args: CycleArgs): void {
  if (!args?.id) {
    window.showErrorMessage('Settings Toggler: missing "id" in args.');
    return;
  }

  const values = resolveValues(args);
  if (!values.length) return;

  const config = workspace.getConfiguration();
  const settingKeys = new Set(values.flatMap(v => Object.keys(v)));
  const scope = resolveScope(settingKeys, args.overrideWorkspaceSettings ?? false, config);

  if (scope === Scope.None) {
    window.showWarningMessage(
      `Settings Toggler: "${args.id}" blocked by workspace settings. Set overrideWorkspaceSettings to override.`
    );
    return;
  }

  const useGlobal = scope === Scope.Global;
  const current = readCurrent(settingKeys, config, useGlobal);
  const index = nextIndex(args.id, values, current);
  applySettings(values[index], config, useGlobal);
  indexCache[args.id] = index;
}

function readCurrent(keys: Set<string>, config: WorkspaceConfiguration, useGlobal: boolean): Dict {
  const result: Dict = {};
  for (const key of keys) {
    const info = config.inspect(key);
    if (useGlobal) {
      result[key] = info?.globalValue !== undefined ? info.globalValue : info?.defaultValue;
    } else {
      result[key] = info?.workspaceValue !== undefined ? info.workspaceValue : info?.defaultValue;
    }
  }
  return result;
}

function nextIndex(id: string, values: Dict[], current: Dict): number {
  if (id in indexCache) {
    return (indexCache[id] + 1) % values.length;
  }
  for (let i = 0; i < values.length; i++) {
    if (deepEqual(values[i], current)) {
      return (i + 1) % values.length;
    }
  }
  return 0;
}

function applySettings(settings: Dict, config: WorkspaceConfiguration, useGlobal: boolean): void {
  for (const [key, val] of Object.entries(settings)) {
    config.update(key, val, useGlobal);
  }
}

function resolveScope(keys: Set<string>, override: boolean, config: WorkspaceConfiguration): Scope {
  let scope = Scope.Global;
  for (const key of keys) {
    const info = config.inspect(key);
    if (info?.workspaceValue != null) {
      if (override) {
        scope = Scope.Workspace;
      } else {
        return Scope.None;
      }
    }
  }
  return scope;
}

// --- Named commands from settings.json ---

function registerNamedCommands() {
  const cmds = workspace.getConfiguration('settings').get<CycleArgs[]>('cycle', []);
  if (deepEqual(cmds, registeredCommands)) return;

  disposeCustom();
  registeredCommands = cmds;
  for (const cmd of cmds) {
    if (!cmd.id) continue;
    customDisposables.push(
      commands.registerCommand(`settings.cycle.${cmd.id}`, () => cycleSetting(cmd))
    );
  }
}

// --- Status bar items ---

function createStatusBarItems() {
  disposeStatusBar();
  const items = workspace.getConfiguration('settings-toggler').get<StatusBarConfig[]>('statusBar', []);
  const config = workspace.getConfiguration();

  for (const item of items) {
    if (!item.property || !item.icon) continue;

    const align = item.alignment === 'left' ? StatusBarAlignment.Left : StatusBarAlignment.Right;
    const sb = window.createStatusBarItem(align, item.priority ?? 0);
    const currentVal = config.get(item.property);
    sb.text = formatStatusText(item, currentVal);
    sb.command = {
      command: 'settings.cycle',
      title: 'Toggle',
      arguments: [{ id: item.property, values: resolveStatusBarValues(item) }]
    };
    sb.tooltip = item.property;
    sb.show();
    statusBarItems.push(sb);
  }
}

function resolveStatusBarValues(item: StatusBarConfig): Dict[] | undefined {
  if (item.values?.length) {
    return item.values.map(v => {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) return v as Dict;
      return { [item.property]: v };
    });
  }
  return undefined;
}

function formatStatusText(item: StatusBarConfig, value: unknown): string {
  const val = typeof value === 'string' ? value : JSON.stringify(value);
  if (item.label) return `$(${item.icon}) ${item.label}: ${val}`;
  return `$(${item.icon}) ${val}`;
}

function updateStatusBarItems() {
  const items = workspace.getConfiguration('settings-toggler').get<StatusBarConfig[]>('statusBar', []);
  const config = workspace.getConfiguration();

  if (items.length !== statusBarItems.length) {
    createStatusBarItems();
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const currentVal = config.get(item.property);
    statusBarItems[i].text = formatStatusText(item, currentVal);
  }
}

// --- Cleanup ---

function disposeCustom() {
  customDisposables.forEach(d => d.dispose());
  customDisposables = [];
}

function disposeStatusBar() {
  statusBarItems.forEach(sb => sb.dispose());
  statusBarItems = [];
}

function disposeAll() {
  disposeCustom();
  disposeStatusBar();
}

// --- Utility ---

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a as Dict).sort();
    const kb = Object.keys(b as Dict).sort();
    if (ka.length !== kb.length) return false;
    return ka.every((k, i) => k === kb[i] && deepEqual((a as Dict)[k], (b as Dict)[k]));
  }
  return false;
}
