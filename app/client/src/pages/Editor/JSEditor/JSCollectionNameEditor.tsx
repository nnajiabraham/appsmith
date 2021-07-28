import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";

import { useParams } from "react-router-dom";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { removeSpecialChars, isNameValid } from "utils/helpers";
import { AppState } from "reducers";
import { JSAction } from "entities/JSAction";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getExistingPageNames } from "sagas/selectors";
import { Classes } from "@blueprintjs/core";
import log from "loglevel";
import { Action } from "entities/Action";
import { saveJSCollectionName } from "actions/jsActionActions";

const ApiNameWrapper = styled.div<{ page?: string }>`
  min-width: 50%;
  margin-right: 10px;
  display: flex;
  justify-content: flex-start;
  align-content: center;
  & > div {
    max-width: 100%;
    flex: 0 1 auto;
    font-size: ${(props) => props.theme.fontSizes[5]}px;
    font-weight: ${(props) => props.theme.fontWeights[2]};
  }

  ${(props) =>
    props.page === "JS_PANE"
      ? `  &&& .${Classes.EDITABLE_TEXT_CONTENT}, &&& .${Classes.EDITABLE_TEXT_INPUT} {
    font-size: ${props.theme.typography.h3.fontSize}px;
    line-height: ${props.theme.typography.h3.lineHeight}px !important;
    letter-spacing: ${props.theme.typography.h3.letterSpacing}px;
    font-weight: ${props.theme.typography.h3.fontWeight};
  }`
      : null}
`;

type ActionNameEditorProps = {
  /*
    This prop checks if page is API Pane or Query Pane or Curl Pane
    So, that we can toggle between ads editable-text component and existing editable-text component
    Right now, it's optional so that it doesn't impact any other pages other than API Pane.
    In future, when default component will be ads editable-text, then we can remove this prop.
  */
  page?: string;
};

export function JSCollectionNameEditor(props: ActionNameEditorProps) {
  const params = useParams<{ collectionId?: string; queryId?: string }>();
  const isNew =
    new URLSearchParams(window.location.search).get("editName") === "true";
  const [forceUpdate, setForceUpdate] = useState(false);
  if (!params.collectionId) {
    log.error("No API id or Query id found in the url.");
  }
  const dispatch = useDispatch();

  const jsActions: JSAction[] = useSelector((state: AppState) =>
    state.entities.jsActions.map((action) => action.config),
  );

  const currentJSCollectionConfig: JSAction | undefined = jsActions.find(
    (action) => action.id === params.collectionId,
  );

  const existingWidgetNames: string[] = useSelector((state: AppState) =>
    Object.values(state.entities.canvasWidgets).map(
      (widget) => widget.widgetName,
    ),
  );

  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );

  const evalTree = useSelector(getDataTree);
  const existingPageNames = useSelector(getExistingPageNames);

  const saveStatus: {
    isSaving: boolean;
    error: boolean;
  } = useSelector((state: AppState) => {
    const id = currentJSCollectionConfig ? currentJSCollectionConfig.id : "";
    return {
      isSaving: state.ui.apiName.isSaving[id],
      error: state.ui.apiName.errors[id],
    };
  });

  const hasNameConflict = useCallback(
    (name: string) => !isNameValid(name, { ...existingPageNames, ...evalTree }),
    [existingPageNames, jsActions, existingWidgetNames, actions],
  );

  const isInvalidJSCollectionName = useCallback(
    (name: string): string | boolean => {
      if (!name || name.trim().length === 0) {
        return "Please enter a valid name";
      } else if (
        name !== currentJSCollectionConfig?.name &&
        hasNameConflict(name)
      ) {
        return `${name} is already being used.`;
      }
      return false;
    },
    [currentJSCollectionConfig, hasNameConflict],
  );

  const handleJSCollectionNameChange = useCallback(
    (name: string) => {
      if (
        currentJSCollectionConfig &&
        name !== currentJSCollectionConfig?.name &&
        !isInvalidJSCollectionName(name)
      ) {
        dispatch(
          saveJSCollectionName({ id: currentJSCollectionConfig.id, name }),
        );
      }
    },
    [dispatch, isInvalidJSCollectionName, currentJSCollectionConfig],
  );

  useEffect(() => {
    if (saveStatus.isSaving === false && saveStatus.error === true) {
      setForceUpdate(true);
    } else if (saveStatus.isSaving === true) {
      setForceUpdate(false);
    } else if (saveStatus.isSaving === false && saveStatus.error === false) {
      // Construct URLSearchParams object instance from current URL querystring.
      const queryParams = new URLSearchParams(window.location.search);

      if (
        queryParams.has("editName") &&
        queryParams.get("editName") === "true"
      ) {
        // Set new or modify existing parameter value.
        queryParams.set("editName", "false");
        // Replace current querystring with the new one.
        history.replaceState({}, "", "?" + queryParams.toString());
      }
    }
  }, [saveStatus.isSaving, saveStatus.error]);

  return (
    <ApiNameWrapper page={props.page}>
      <div
        style={{
          display: "flex",
        }}
      >
        <EditableText
          className="t--action-name-edit-field"
          defaultValue={
            currentJSCollectionConfig ? currentJSCollectionConfig.name : ""
          }
          editInteractionKind={EditInteractionKind.SINGLE}
          forceDefault={forceUpdate}
          isEditingDefault={isNew}
          isInvalid={isInvalidJSCollectionName}
          onTextChanged={handleJSCollectionNameChange}
          placeholder="Name of the function in camelCase"
          type="text"
          updating={saveStatus.isSaving}
          valueTransform={removeSpecialChars}
        />
      </div>
    </ApiNameWrapper>
  );
}

export default JSCollectionNameEditor;