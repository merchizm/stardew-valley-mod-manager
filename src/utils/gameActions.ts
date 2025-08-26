import { invoke } from "@tauri-apps/api/core";

// Game Actions
export async function startGame(): Promise<void> {
  try {
    const result = await invoke<boolean>('start_game');
    console.log('Game started:', result);
    // TODO: Show toast notification
  } catch (error) {
    console.error('Error starting game:', error);
  }
}

export async function openFolder(folderType: string): Promise<void> {
  try {
    await invoke<boolean>('open_folder', { folderType });
  } catch (error) {
    console.error('Error opening folder:', error);
  }
}