import React, { createContext, useReducer, useContext } from 'react';
import * as queryDef from '../remedy/utilities/remedy_query_def';

export const AutoCompleteContext = createContext({});
// Actions
export const ADD_InputAutoComplete = 'ADD_InputAutoComplete';
export const REMOVE_InputAutoComplete = 'REMOVE_InputAutoComplete';
export const UPDATE_InputAutoComplete = 'UPDATE_InputAutoComplete';
export const CLEAR_ALL = 'CLEAR_ALL';

// Action creators
export function addInputAutoComplete(action: any) {
  return { type: ADD_InputAutoComplete, guid: action.guid, inputAutoComplete: action.inputAutoComplete };
}

export function removeInputAutoComplete(action: any) {
  return { type: REMOVE_InputAutoComplete, guid: action.guid };
}

export function clearAll() {
  return { type: CLEAR_ALL };
}

// Reducer
export function todoReducer(state: any, action: any) {
  switch (action.type) {
    case ADD_InputAutoComplete:
      return { ...state, [action.guid]: action.inputAutoComplete };
    case REMOVE_InputAutoComplete:
      const copy = { ...state };
      delete copy[action.guid];
      return copy;
    case UPDATE_InputAutoComplete: {
      const copy = {
        ...state,
        [action.guid]: {
          ...state[action.guid],
          ...action.value,
        },
      };
      return copy;
    }
    case CLEAR_ALL:
      return {};
    default:
      return state;
  }
}

function AutoCompleteContextProvider(props: any) {
  const [inputAutoComplete, dispatch] = useReducer(todoReducer, { [props.guid]: queryDef.getAutoComplete() });

  const todoData = { inputAutoComplete, dispatch };

  return <AutoCompleteContext.Provider value={todoData} {...props} />;
}

function useAutoCompleteContext() {
  return useContext(AutoCompleteContext);
}

export { AutoCompleteContextProvider, useAutoCompleteContext };
