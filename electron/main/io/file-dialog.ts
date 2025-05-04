import { dialog, BrowserWindow } from 'electron';

export async function openFileDialog(win: BrowserWindow) {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
    });
    if (result.canceled) {
        return null
    };

    return result.filePaths[0];
}
