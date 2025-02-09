import { find, get, set } from "lodash";
import { AppState } from "reducers";
import { createSelector } from "reselect";

import { WidgetProps } from "widgets/BaseWidget";
import { getCanvasWidgets } from "./entitiesSelector";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getSelectedWidget, getSelectedWidgets } from "./ui";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import { DataTreeEntity } from "entities/DataTree/dataTreeFactory";

export type WidgetProperties = WidgetProps & {
  [EVALUATION_PATH]?: DataTreeEntity;
};

export const getPropertyPaneState = (state: AppState): PropertyPaneReduxState =>
  state.ui.propertyPane;

export const getCurrentWidgetId = createSelector(
  getPropertyPaneState,
  (propertyPane: PropertyPaneReduxState) => propertyPane.widgetId,
);

export const getCurrentWidgetProperties = createSelector(
  getCanvasWidgets,
  getPropertyPaneState,
  (
    widgets: CanvasWidgetsReduxState,
    pane: PropertyPaneReduxState,
  ): WidgetProps | undefined => {
    return get(widgets, `${pane.widgetId}`);
  },
);

export const getWidgetPropsForPropertyPane = createSelector(
  getCurrentWidgetProperties,
  getDataTree,
  (
    widget: WidgetProps | undefined,
    evaluatedTree: DataTree,
  ): WidgetProps | undefined => {
    if (!widget) return undefined;
    const evaluatedWidget = find(evaluatedTree, {
      widgetId: widget.widgetId,
    }) as DataTreeWidget;
    const widgetProperties = { ...widget };

    if (evaluatedWidget) {
      widgetProperties[EVALUATION_PATH] = evaluatedWidget[EVALUATION_PATH];
    }
    return widgetProperties;
  },
);

const populateWidgetProperties = (
  widget: WidgetProps | undefined,
  propertyPath: string,
  dependencies: string[],
) => {
  const widgetProperties: any = {};

  if (!widget) return widgetProperties;

  widgetProperties.type = widget.type;
  widgetProperties.widgetName = widget.widgetName;
  widgetProperties.widgetId = widget.widgetId;
  widgetProperties.dynamicTriggerPathList = widget.dynamicTriggerPathList;
  widgetProperties.dynamicPropertyPathList = widget.dynamicPropertyPathList;

  getAndSetPath(widget, widgetProperties, propertyPath);

  if (dependencies && dependencies.length > 0) {
    for (const dependentProperty of dependencies) {
      widgetProperties[dependentProperty] = widget[dependentProperty];
    }
  }

  return widgetProperties;
};

const getAndSetPath = (from: any, to: any, path: string) => {
  if (!from || !to) return;

  const value = get(from, path);

  if (value === null || value === undefined) return;

  set(to, path, value);
};

const populateEvaluatedWidgetProperties = (
  evaluatedWidget: DataTreeWidget,
  propertyPath: string,
) => {
  if (!evaluatedWidget || !evaluatedWidget[EVALUATION_PATH]) return;

  const evaluatedWidgetPath = evaluatedWidget[EVALUATION_PATH];

  const evaluatedProperties = {
    errors: {},
    evaluatedValues: {},
  };

  getAndSetPath(
    evaluatedWidgetPath?.errors,
    evaluatedProperties.errors,
    propertyPath,
  );
  getAndSetPath(
    evaluatedWidgetPath?.evaluatedValues,
    evaluatedProperties.evaluatedValues,
    propertyPath,
  );

  return evaluatedProperties;
};

export const getWidgetPropsForPropertyName = (
  propertyName: string,
  dependencies: string[] = [],
) => {
  return createSelector(
    getCurrentWidgetProperties,
    getDataTree,
    (
      widget: WidgetProps | undefined,
      evaluatedTree: DataTree,
    ): WidgetProperties => {
      const evaluatedWidget = find(evaluatedTree, {
        widgetId: widget?.widgetId,
      }) as DataTreeWidget;

      const widgetProperties = populateWidgetProperties(
        widget,
        propertyName,
        dependencies,
      );

      widgetProperties[EVALUATION_PATH] = populateEvaluatedWidgetProperties(
        evaluatedWidget,
        propertyName,
      );

      return widgetProperties;
    },
  );
};

const isResizingorDragging = (state: AppState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

export const getIsPropertyPaneVisible = createSelector(
  getPropertyPaneState,
  isResizingorDragging,
  getSelectedWidget,
  getSelectedWidgets,
  (
    pane: PropertyPaneReduxState,
    isResizingorDragging: boolean,
    lastSelectedWidget,
    widgets,
  ) => {
    const isWidgetSelected = pane.widgetId
      ? lastSelectedWidget === pane.widgetId || widgets.includes(pane.widgetId)
      : false;
    const multipleWidgetsSelected = !!(widgets && widgets.length >= 2);
    return !!(
      isWidgetSelected &&
      !multipleWidgetsSelected &&
      !isResizingorDragging &&
      pane.isVisible &&
      pane.widgetId
    );
  },
);
