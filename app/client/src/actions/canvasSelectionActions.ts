import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { SelectedArenaDimensions } from "pages/common/CanvasSelectionArena";

export const setCanvasSelectionStateAction = (
  start: boolean,
  widgetId: string,
) => {
  return {
    type: start
      ? ReduxActionTypes.START_CANVAS_SELECTION
      : ReduxActionTypes.STOP_CANVAS_SELECTION,
    payload: {
      widgetId,
    },
  };
};

export const selectAllWidgetsInAreaAction = (
  selectionArena: SelectedArenaDimensions,
  snapToNextColumn: boolean,
  snapToNextRow: boolean,
  isMultiSelect: boolean,
  snapSpaces: {
    snapColumnSpace: number;
    snapRowSpace: number;
  },
): ReduxAction<any> => {
  return {
    type: ReduxActionTypes.SELECT_WIDGETS_IN_AREA,
    payload: {
      selectionArena,
      snapToNextColumn,
      snapToNextRow,
      isMultiSelect,
      snapSpaces,
    },
  };
};
