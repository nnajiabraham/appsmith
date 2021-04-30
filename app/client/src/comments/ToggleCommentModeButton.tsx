import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { ReactComponent as ToggleCommmentMode } from "assets/icons/comments/toggle-comment-mode.svg";
import {
  setCommentMode as setCommentModeAction,
  fetchApplicationCommentsRequest,
} from "actions/commentActions";
import {
  commentModeSelector,
  areCommentsEnabledForUser as areCommentsEnabledForUserSelector,
  showUnreadIndicator as showUnreadIndicatorSelector,
} from "../selectors/commentsSelectors";
import { useLocation } from "react-router";
import history from "utils/history";

const StyledToggleCommentMode = styled.div<{ isCommentMode: boolean }>`
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  background: ${(props) =>
    !props.isCommentMode
      ? props.theme.colors.comments.commentModeButtonBackground
      : props.theme.colors.comments.commentModeButtonIcon};
  svg path {
    fill: ${(props) =>
      props.isCommentMode
        ? "#fff"
        : props.theme.colors.comments.commentModeButtonIcon};
  }

  height: ${(props) => props.theme.smallHeaderHeight};
  width: ${(props) => props.theme.smallHeaderHeight};
`;

const StyledIndicator = styled.div`
  position: absolute;
  right: 8px;
  top: 8px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: ${(props) => props.theme.colors.comments.unreadIndicator};
`;

function UnreadIndicator() {
  const showUnreadIndicator = useSelector(showUnreadIndicatorSelector);
  return showUnreadIndicator ? <StyledIndicator /> : null;
}

// update isCommentMode in the store based on the query search param
const useUpdateCommentModeInStore = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const setCommentModeInStore = useCallback(
    (updatedIsCommentMode) =>
      dispatch(setCommentModeAction(updatedIsCommentMode)),
    [],
  );

  useEffect(() => {
    if (window.location.href) {
      const searchParams = new URL(window.location.href).searchParams;
      const isCommentMode = searchParams.get("isCommentMode");
      if (isCommentMode) {
        const updatedIsCommentMode = isCommentMode === "true" ? true : false;
        setCommentModeInStore(updatedIsCommentMode);
      }
    }
  }, [location]);
};

/**
 * Toggle comment mode:
 * This component is also responsible for fetching
 * application comments
 */
function ToggleCommentModeButton() {
  const dispatch = useDispatch();

  const commentsEnabled = useSelector(areCommentsEnabledForUserSelector);
  const isCommentMode = useSelector(commentModeSelector);

  const setCommentModeInUrl = useCallback(() => {
    const currentURL = new URL(window.location.href);
    const searchParams = currentURL.searchParams;
    searchParams.set("isCommentMode", `${!isCommentMode}`);
    // remove comment link params so that they don't get retriggered
    // on toggling comment mode
    searchParams.delete("commentId");
    searchParams.delete("commentThreadId");
    history.replace({
      pathname: currentURL.pathname,
      search: searchParams.toString(),
      hash: currentURL.hash,
    });
  }, [isCommentMode]);

  // fetch applications comments when comment mode is turned on
  useEffect(() => {
    if (isCommentMode) {
      dispatch(fetchApplicationCommentsRequest());
    }
  }, [isCommentMode]);

  useUpdateCommentModeInStore();

  return commentsEnabled ? (
    <StyledToggleCommentMode
      isCommentMode={isCommentMode}
      onClick={setCommentModeInUrl}
    >
      <UnreadIndicator />
      <ToggleCommmentMode />
    </StyledToggleCommentMode>
  ) : null;
}

export default ToggleCommentModeButton;