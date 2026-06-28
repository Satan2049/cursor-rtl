import * as vscode from 'vscode';
import * as fs from 'fs';
import { OUTPUT_CHANNEL } from './constants';
import { getAppOutDir, getMainJsPath, isCursorApp, validatePaths } from './paths';
import {
    applyPatch,
    copyLoader,
    getDryRunSummary,
    getPatchState,
    handlePermissionError,
    isPatched,
    PatchState,
    removePatch,
} from './patcher';

let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;
let fileWatcher: fs.FSWatcher | undefined;
let blinkInterval: ReturnType<typeof setInterval> | undefined;
let blinkTimeout: ReturnType<typeof setTimeout> | undefined;

function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL);
    }
    return outputChannel;
}

function log(message: string): void {
    getOutputChannel().appendLine(message);
}

function stopBlink(): void {
    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = undefined;
    }
    if (blinkTimeout) {
        clearTimeout(blinkTimeout);
        blinkTimeout = undefined;
    }
}

function startBlink(themeColorId: string): void {
    const blinkDurationMs = 60_000;

    statusBarItem.backgroundColor = new vscode.ThemeColor(themeColorId);
    blinkInterval = setInterval(() => {
        statusBarItem.backgroundColor = statusBarItem.backgroundColor
            ? undefined
            : new vscode.ThemeColor(themeColorId);
    }, 800);
    blinkTimeout = setTimeout(() => {
        stopBlink();
        statusBarItem.backgroundColor = new vscode.ThemeColor(themeColorId);
    }, blinkDurationMs);
}

function updateStatusBar(state: PatchState): void {
    const config = vscode.workspace.getConfiguration('cursorRtl');
    if (!config.get<boolean>('showStatusBar', true)) {
        statusBarItem.hide();
        return;
    }

    stopBlink();

    switch (state) {
        case 'on':
            statusBarItem.text = '$(check) RTL: ON';
            statusBarItem.backgroundColor = undefined;
            statusBarItem.tooltip = 'RTL support is active. Click to manage.';
            break;
        case 'off':
            statusBarItem.text = '$(circle-slash) RTL: OFF';
            statusBarItem.tooltip = 'RTL support is not applied. Click to enable.';
            startBlink('statusBarItem.errorBackground');
            break;
        case 'update-needed':
            statusBarItem.text = '$(warning) RTL: UPDATE NEEDED';
            statusBarItem.tooltip =
                'Cursor was updated and the RTL patch needs to be re-applied. Click to fix.';
            startBlink('statusBarItem.warningBackground');
            break;
    }

    statusBarItem.show();
}

async function promptRestart(message: string): Promise<void> {
    const restart = await vscode.window.showInformationMessage(
        message,
        'Quit Cursor',
        'Later'
    );

    if (restart === 'Quit Cursor') {
        await vscode.commands.executeCommand('workbench.action.quit');
    }
}

function ensureCursorApp(): boolean {
    if (!isCursorApp()) {
        vscode.window.showWarningMessage(
            'Cursor RTL: This extension is designed for Cursor IDE. It may not work in VS Code.'
        );
        return false;
    }
    return true;
}

async function showQuickPick(): Promise<void> {
    const mainJsPath = getMainJsPath();
    const state = getPatchState(mainJsPath);
    const items: vscode.QuickPickItem[] = [];

    if (state === 'on') {
        items.push(
            { label: '$(circle-slash) Disable RTL', description: 'Remove patch and restore original main.js' },
            { label: '$(info) Check Status', description: 'Show current RTL patch status' }
        );
    } else {
        items.push(
            { label: '$(check) Enable RTL', description: 'Apply RTL patch to Cursor' },
            { label: '$(info) Check Status', description: 'Show current RTL patch status' }
        );
    }

    if (state === 'update-needed' || state === 'off') {
        items.unshift({
            label: '$(refresh) Re-apply After Update',
            description: 'Re-apply patch after a Cursor update',
        });
    }

    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Cursor RTL Chat',
    });

    if (!picked) {
        return;
    }

    if (picked.label.includes('Enable')) {
        await vscode.commands.executeCommand('cursorRtl.enable');
    } else if (picked.label.includes('Disable')) {
        await vscode.commands.executeCommand('cursorRtl.disable');
    } else if (picked.label.includes('Re-apply')) {
        await vscode.commands.executeCommand('cursorRtl.reapply');
    } else if (picked.label.includes('Status')) {
        await vscode.commands.executeCommand('cursorRtl.status');
    }
}

async function enableCommand(context: vscode.ExtensionContext): Promise<void> {
    if (!ensureCursorApp()) {
        return;
    }

    const validation = validatePaths();
    if (!validation.valid) {
        vscode.window.showErrorMessage(`Cursor RTL: ${validation.error}`);
        return;
    }

    const mainJsPath = validation.mainJsPath;
    const outDir = getAppOutDir();
    const dryRun = getDryRunSummary(mainJsPath);
    const detail = dryRun.map((action) => `• ${action}`).join('\n');

    const confirm = await vscode.window.showWarningMessage(
        'Enable RTL support for Cursor chat?\n\nThis will modify Cursor app files.',
        { modal: true, detail },
        'Enable'
    );

    if (confirm !== 'Enable') {
        return;
    }

    try {
        log('Enabling RTL support...');
        copyLoader(outDir, context.extensionPath);
        applyPatch(mainJsPath);
        updateStatusBar('on');
        setupFileWatcher(mainJsPath, context);
        dryRun.forEach((action) => log(`  ${action}`));
        log('RTL patch applied successfully.');

        await promptRestart(
            'RTL patch applied successfully! Please close and reopen all Cursor windows to activate.'
        );
    } catch (error) {
        log(`Error: ${handlePermissionError(error)}`);
        vscode.window.showErrorMessage(`Cursor RTL: ${handlePermissionError(error)}`);
    }
}

async function disableCommand(): Promise<void> {
    const validation = validatePaths();
    if (!validation.valid) {
        vscode.window.showErrorMessage(`Cursor RTL: ${validation.error}`);
        return;
    }

    const mainJsPath = validation.mainJsPath;
    const confirm = await vscode.window.showWarningMessage(
        'Disable RTL support?\n\nThis will restore the original main.js from backup.',
        { modal: true },
        'Disable'
    );

    if (confirm !== 'Disable') {
        return;
    }

    try {
        log('Disabling RTL support...');
        removePatch(mainJsPath);
        updateStatusBar('off');
        log('RTL patch removed.');

        await promptRestart(
            'RTL patch removed. Please close and reopen all Cursor windows to apply changes.'
        );
    } catch (error) {
        log(`Error: ${handlePermissionError(error)}`);
        vscode.window.showErrorMessage(`Cursor RTL: ${handlePermissionError(error)}`);
    }
}

async function statusCommand(): Promise<void> {
    const validation = validatePaths();
    if (!validation.valid) {
        vscode.window.showErrorMessage(`Cursor RTL: ${validation.error}`);
        return;
    }

    const mainJsPath = validation.mainJsPath;
    const state = getPatchState(mainJsPath);
    const channel = getOutputChannel();
    channel.clear();
    channel.appendLine(`IDE: ${vscode.env.appName}`);
    channel.appendLine(`main.js: ${mainJsPath}`);
    channel.appendLine(`Patch state: ${state}`);
    channel.appendLine(`Patched: ${isPatched(mainJsPath) ? 'yes' : 'no'}`);
    channel.show(true);

    switch (state) {
        case 'on':
            vscode.window.showInformationMessage('Cursor RTL: Patch is ACTIVE. RTL support is enabled.');
            break;
        case 'off':
            vscode.window.showInformationMessage(
                'Cursor RTL: Patch is NOT applied. Use "Cursor RTL: Enable RTL Support" to activate.'
            );
            break;
        case 'update-needed': {
            const choice = await vscode.window.showWarningMessage(
                'Cursor RTL: Cursor was updated and the patch needs to be re-applied.',
                'Re-apply Now'
            );
            if (choice === 'Re-apply Now') {
                await vscode.commands.executeCommand('cursorRtl.reapply');
            }
            break;
        }
    }

    updateStatusBar(state);
}

async function reapplyCommand(context: vscode.ExtensionContext): Promise<void> {
    const validation = validatePaths();
    if (!validation.valid) {
        vscode.window.showErrorMessage(`Cursor RTL: ${validation.error}`);
        return;
    }

    const mainJsPath = validation.mainJsPath;
    const outDir = getAppOutDir();

    try {
        log('Re-applying RTL patch...');
        copyLoader(outDir, context.extensionPath);
        applyPatch(mainJsPath);
        updateStatusBar('on');
        setupFileWatcher(mainJsPath, context);
        log('RTL patch re-applied successfully.');

        await promptRestart(
            'RTL patch re-applied successfully! Please close and reopen all Cursor windows to activate.'
        );
    } catch (error) {
        log(`Error: ${handlePermissionError(error)}`);
        vscode.window.showErrorMessage(`Cursor RTL: ${handlePermissionError(error)}`);
    }
}

async function toggleCommand(context: vscode.ExtensionContext): Promise<void> {
    const state = getPatchState(getMainJsPath());
    if (state === 'on') {
        await disableCommand();
    } else {
        await enableCommand(context);
    }
}

function refreshLoader(context: vscode.ExtensionContext): void {
    try {
        copyLoader(getAppOutDir(), context.extensionPath);
    } catch {
        // Non-critical — loader is self-discovering.
    }
}

function setupFileWatcher(mainJsPath: string, context: vscode.ExtensionContext): void {
    if (fileWatcher) {
        fileWatcher.close();
    }

    try {
        fileWatcher = fs.watch(mainJsPath, (eventType) => {
            if (eventType !== 'change') {
                return;
            }

            setTimeout(async () => {
                const state = getPatchState(mainJsPath);
                if (state !== 'update-needed' && state !== 'off') {
                    return;
                }

                log('Cursor update detected — RTL patch may need re-application.');
                updateStatusBar('update-needed');

                const config = vscode.workspace.getConfiguration('cursorRtl');
                if (config.get<boolean>('autoReapply', true)) {
                    await reapplyCommand(context);
                    return;
                }

                const choice = await vscode.window.showWarningMessage(
                    'Cursor was updated and the RTL patch was removed. Re-apply?',
                    'Re-apply',
                    'Dismiss'
                );
                if (choice === 'Re-apply') {
                    await vscode.commands.executeCommand('cursorRtl.reapply');
                }
            }, 1000);
        });
    } catch {
        // fs.watch may fail on some platforms — non-critical.
    }
}

async function autoReapplyOnStartup(context: vscode.ExtensionContext): Promise<void> {
    const mainJsPath = getMainJsPath();
    const state = getPatchState(mainJsPath);

    if (state === 'on') {
        refreshLoader(context);
        return;
    }

    if (state === 'update-needed') {
        const config = vscode.workspace.getConfiguration('cursorRtl');
        if (config.get<boolean>('autoReapply', true)) {
            log('Auto-reapplying RTL patch after Cursor update...');
            await reapplyCommand(context);
        }
    }
}

export function activate(context: vscode.ExtensionContext): void {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cursorRtl.quickPick';
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(
        vscode.commands.registerCommand('cursorRtl.quickPick', showQuickPick),
        vscode.commands.registerCommand('cursorRtl.enable', () => enableCommand(context)),
        vscode.commands.registerCommand('cursorRtl.disable', disableCommand),
        vscode.commands.registerCommand('cursorRtl.status', statusCommand),
        vscode.commands.registerCommand('cursorRtl.reapply', () => reapplyCommand(context)),
        vscode.commands.registerCommand('cursorRtl.toggle', () => toggleCommand(context))
    );

    const mainJsPath = getMainJsPath();
    const state = getPatchState(mainJsPath);
    updateStatusBar(state);

    if (state === 'on') {
        refreshLoader(context);
    }

    if (fs.existsSync(mainJsPath) && (state === 'on' || state === 'update-needed')) {
        setupFileWatcher(mainJsPath, context);
    }

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('cursorRtl.showStatusBar')) {
            updateStatusBar(getPatchState(mainJsPath));
        }
    }, null, context.subscriptions);

    const explained = context.globalState.get<boolean>('cursorRtl.usageExplained');
    if (!explained) {
        void context.globalState.update('cursorRtl.usageExplained', true);
        log('Cursor RTL Chat — getting started');
        log('1. Open Command Palette (Ctrl+Shift+P) → "Cursor RTL: Enable RTL Support"');
        log('2. Fully quit Cursor and reopen (Reload Window is not always enough)');
        log('3. Open chat — Hebrew, Arabic, and Persian text will auto-align right');
        log('');
    }

    autoReapplyOnStartup(context).catch((error) => {
        log(`Auto-reapply failed: ${error}`);
    });
}

export function deactivate(): void {
    stopBlink();
    if (fileWatcher) {
        fileWatcher.close();
        fileWatcher = undefined;
    }
    outputChannel?.dispose();
}
