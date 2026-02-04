import { ACTIONS } from './hiveActions';
import { getISOTimestamp } from '../utils/dateUtils';
import { generateId } from '../utils/storage';

export const hiveReducer = (state, action) => {
  const timestamp = getISOTimestamp();

  switch (action.type) {
    case ACTIONS.SET_STATE:
      return { ...action.payload };

    case ACTIONS.ADD_CHILD: {
      const newChild = {
        id: generateId(),
        name: action.payload.name,
        avatar: action.payload.avatar,
        honey: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return {
        ...state,
        children: [...state.children, newChild],
      };
    }

    case ACTIONS.UPDATE_CHILD: {
      return {
        ...state,
        children: state.children.map((child) =>
          child.id === action.payload.id ? { ...child, ...action.payload, updatedAt: timestamp } : child
        ),
      };
    }

    case ACTIONS.DELETE_CHILD: {
      return {
        ...state,
        children: state.children.filter((child) => child.id !== action.payload),
        entries: state.entries.filter((entry) => entry.childId !== action.payload),
      };
    }

    case ACTIONS.ADD_ENTRY: {
      const newEntry = {
        id: generateId(),
        childId: action.payload.childId || null,
        date: action.payload.date,
        type: action.payload.type,
        icon: action.payload.icon,
        note: action.payload.note || '',
        honey: action.payload.honey || 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const updatedChildren = action.payload.childId
        ? state.children.map((child) =>
            child.id === action.payload.childId
              ? { ...child, honey: child.honey + (action.payload.honey || 0), updatedAt: timestamp }
              : child
          )
        : state.children;
      return {
        ...state,
        entries: [...state.entries, newEntry],
        children: updatedChildren,
      };
    }

    case ACTIONS.UPDATE_ENTRY: {
      const oldEntry = state.entries.find((e) => e.id === action.payload.id);
      const honeyDiff = (action.payload.honey || 0) - (oldEntry?.honey || 0);
      const updatedChildren = state.children.map((child) =>
        child.id === oldEntry?.childId
          ? { ...child, honey: child.honey + honeyDiff, updatedAt: timestamp }
          : child
      );
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id ? { ...entry, ...action.payload, updatedAt: timestamp } : entry
        ),
        children: updatedChildren,
      };
    }

    case ACTIONS.DELETE_ENTRY: {
      const entryToDelete = state.entries.find((e) => e.id === action.payload);
      const updatedChildren = state.children.map((child) =>
        child.id === entryToDelete?.childId
          ? { ...child, honey: child.honey - (entryToDelete?.honey || 0), updatedAt: timestamp }
          : child
      );
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.payload),
        children: updatedChildren,
      };
    }

    case ACTIONS.ADD_EVENT: {
      const newEvent = {
        id: generateId(),
        title: action.payload.title,
        date: action.payload.date,
        icon: action.payload.icon,
        note: action.payload.note || '',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return {
        ...state,
        events: [...state.events, newEvent],
      };
    }

    case ACTIONS.UPDATE_EVENT: {
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.id ? { ...event, ...action.payload, updatedAt: timestamp } : event
        ),
      };
    }

    case ACTIONS.DELETE_EVENT: {
      return {
        ...state,
        events: state.events.filter((event) => event.id !== action.payload),
      };
    }

    case ACTIONS.UPDATE_HONEY: {
      return {
        ...state,
        children: state.children.map((child) =>
          child.id === action.payload.childId
            ? { ...child, honey: action.payload.honey, updatedAt: timestamp }
            : child
        ),
      };
    }

    case ACTIONS.ADD_BIRTHDAY: {
      const newBirthday = {
        id: generateId(),
        name: action.payload.name,
        date: action.payload.date, // MM-DD format for recurring
        icon: action.payload.icon || '🎂',
        note: action.payload.note || '',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return {
        ...state,
        birthdays: [...(state.birthdays || []), newBirthday],
      };
    }

    case ACTIONS.UPDATE_BIRTHDAY: {
      return {
        ...state,
        birthdays: (state.birthdays || []).map((birthday) =>
          birthday.id === action.payload.id ? { ...birthday, ...action.payload, updatedAt: timestamp } : birthday
        ),
      };
    }

    case ACTIONS.DELETE_BIRTHDAY: {
      return {
        ...state,
        birthdays: (state.birthdays || []).filter((birthday) => birthday.id !== action.payload),
      };
    }

    case ACTIONS.SET_DAILY_FUN_CATEGORY: {
      return {
        ...state,
        settings: {
          ...(state.settings || {}),
          dailyFunCategory: action.payload,
        },
      };
    }

    default:
      return state;
  }
};
