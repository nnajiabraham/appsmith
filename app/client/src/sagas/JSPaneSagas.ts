import {
  all,
  select,
  put,
  takeEvery,
  debounce,
  call,
} from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getJSAction, getJSActions } from "selectors/entitiesSelector";
import { JSActionData } from "reducers/entityReducers/jsActionsReducer";
import { createNewJSFunctionName } from "utils/AppsmithUtils";
import { JSAction } from "entities/JSAction";
import { createJSActionRequest } from "actions/jsActionActions";
import { JS_FUNCTION_ID_URL } from "constants/routes";
import history from "utils/history";
import { parseJSAction } from "./EvaluationsSaga";
import { getJSActionIdFromURL } from "../pages/Editor/Explorer/helpers";
import { getDifferenceInJSAction } from "../utils/JSPaneUtils";
import JSActionAPI from "../api/JSActionAPI";
import {
  updateJSActionSuccess,
  addJSCollectionAction,
  updateJSCollectionAction,
  deleteJSCollectionAction,
} from "../actions/jsPaneActions";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getPluginIdOfPackageName } from "sagas/selectors";
import { PluginType } from "entities/Action";

export const JS_PLUGIN_PACKAGE_NAME = "js-plugin";

function* handleCreateNewJsActionSaga(action: ReduxAction<{ pageId: string }>) {
  const organizationId: string = yield select(getCurrentOrgId);
  const applicationId = yield select(getCurrentApplicationId);
  const { pageId } = action.payload;
  const pluginId: string = yield select(
    getPluginIdOfPackageName,
    JS_PLUGIN_PACKAGE_NAME,
  );
  if (pageId && pluginId) {
    const jsactions = yield select(getJSActions);
    const pageJSActions = jsactions.filter(
      (a: JSActionData) => a.config.pageId === pageId,
    );
    const newJSActionName = createNewJSFunctionName(pageJSActions, pageId);
    const sampleBody =
      "{\n\t\tresults: [],\n\t\trun: () => {\n\t\t\t//write code here\n\t}\n}";
    yield put(
      createJSActionRequest({
        name: newJSActionName,
        pageId,
        organizationId,
        pluginId,
        body: sampleBody,
        variables: [],
        actions: [],
        applicationId,
        pluginType: PluginType.JS,
      }),
    );
  }
}

function* handleJSActionCreatedSaga(actionPayload: ReduxAction<JSAction>) {
  const { id } = actionPayload.payload;
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  history.push(JS_FUNCTION_ID_URL(applicationId, pageId, id, {}));
}

function* handleParseUpdateJSAction(actionPayload: { body: string }) {
  const body = actionPayload.body;
  const parsedBody = yield call(parseJSAction, body);
  const jsActionId = getJSActionIdFromURL();
  const organizationId: string = yield select(getCurrentOrgId);
  if (jsActionId) {
    const jsAction: JSAction = yield select(getJSAction, jsActionId);
    const data = getDifferenceInJSAction(parsedBody, jsAction);
    const jsActionTobeUpdated = JSON.parse(JSON.stringify(jsAction));
    jsActionTobeUpdated.body = body;
    jsActionTobeUpdated.variables = parsedBody.variables;
    if (data.newActions.length) {
      for (let i = 0; i < data.newActions.length; i++) {
        jsActionTobeUpdated.actions.push({
          ...data.newActions[i],
          organizationId: organizationId,
        });
      }
      yield put(
        addJSCollectionAction({
          jsAction: jsAction,
          subActions: data.newActions,
        }),
      );
    }
    if (data.updateActions.length > 0) {
      let changedActions = [];
      for (let i = 0; i < data.updateActions.length; i++) {
        changedActions = jsActionTobeUpdated.actions.map((js: any) => {
          if (js.id === data.updateActions[i].id) {
            return data.updateActions[i];
          }
          return js;
        });
      }
      jsActionTobeUpdated.actions = changedActions;
      yield put(
        updateJSCollectionAction({
          jsAction: jsAction,
          subActions: data.updateActions,
        }),
      );
    }
    if (data.deletedActions.length > 0) {
      for (let i = 0; i < data.deletedActions.length; i++) {
        jsActionTobeUpdated.actions.map((js: any) => {
          if (js.id !== data.deletedActions[i].id) {
            return js;
          }
        });
      }
      yield put(
        deleteJSCollectionAction({
          jsAction: jsAction,
          subActions: data.deletedActions,
        }),
      );
    }
    return jsActionTobeUpdated;
  }
}

function* handleUpdateJSAction(actionPayload: ReduxAction<{ body: string }>) {
  let jsAction = {};
  const jsActionId = getJSActionIdFromURL();
  if (jsActionId) {
    jsAction = yield select(getJSAction, jsActionId);
  }
  try {
    const { body } = actionPayload.payload;
    const data = yield call(handleParseUpdateJSAction, { body: body });
    if (data) {
      const response = yield JSActionAPI.updateJSAction(data);
      yield put(updateJSActionSuccess({ data: response?.data }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_JS_ACTION_ERROR,
      payload: { error, data: jsAction },
    });
  }
}

export default function* root() {
  yield all([
    takeEvery(
      ReduxActionTypes.CREATE_NEW_JS_ACTION,
      handleCreateNewJsActionSaga,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_JS_ACTION_SUCCESS,
      handleJSActionCreatedSaga,
    ),
    debounce(
      1000,
      ReduxActionTypes.UPDATE_JS_ACTION_INIT,
      handleUpdateJSAction,
    ),
  ]);
}