import { STORAGE_KEY, STORAGE_VERSION } from './constants';
import { getISOTimestamp } from './dateUtils';

const getInitialState = () => ({
  children: [],
  entries: [],
  events: [],
  birthdays: [],
  settings: {
    dailyFunCategory: 'animal',
  },
  version: STORAGE_VERSION,
  lastModified: getISOTimestamp(),
});

export const loadState = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return getInitialState();
    }
    const state = JSON.parse(serialized);
    // Ensure birthdays array exists
    if (!state.birthdays) {
      state.birthdays = [];
    }
    // Ensure settings object exists
    if (!state.settings) {
      state.settings = { dailyFunCategory: 'animal' };
    }
    if (state.version !== STORAGE_VERSION) {
      return migrateState(state);
    }
    return state;
  } catch (error) {
    console.error('Failed to load state:', error);
    return getInitialState();
  }
};

export const saveState = (state) => {
  try {
    const stateToSave = {
      ...state,
      lastModified: getISOTimestamp(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    return true;
  } catch (error) {
    console.error('Failed to save state:', error);
    return false;
  }
};

const migrateState = (oldState) => {
  let state = { ...oldState };

  // Future migrations go here
  // if (state.version < 2) { state = migrateV1toV2(state); }

  state.version = STORAGE_VERSION;
  state.lastModified = getISOTimestamp();
  saveState(state);
  return state;
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const exportData = () => {
  try {
    const state = loadState();
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `busybee-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export data:', error);
    return false;
  }
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.children && data.entries && data.events) {
          saveState(data);
          resolve(data);
        } else {
          reject(new Error('Invalid backup file format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const getBackupData = () => {
  return loadState();
};
