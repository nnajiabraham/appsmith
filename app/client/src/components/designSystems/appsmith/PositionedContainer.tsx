import React, { CSSProperties, ReactNode, useCallback, useMemo } from "react";
import { BaseStyle } from "widgets/BaseWidget";
import { WidgetType, WIDGET_PADDING } from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import styled from "styled-components";
import { useClickOpenPropPane } from "utils/hooks/useClickOpenPropPane";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "../../../selectors/editorSelectors";

const PositionedWidget = styled.div<{ zIndexOnHover: number }>`
  &:hover {
    z-index: ${(props) => props.zIndexOnHover} !important;
  }
`;
export type PositionedContainerProps = {
  style: BaseStyle;
  children: ReactNode;
  widgetId: string;
  widgetType: WidgetType;
  selected?: boolean;
  focused?: boolean;
  resizeDisabled?: boolean;
};

export function PositionedContainer(props: PositionedContainerProps) {
  const x = props.style.xPosition + (props.style.xPositionUnit || "px");
  const y = props.style.yPosition + (props.style.yPositionUnit || "px");
  const padding = WIDGET_PADDING;
  const openPropertyPane = useClickOpenPropPane();
  const isSnipingMode = useSelector(snipingModeSelector);
  // memoized classname
  const containerClassName = useMemo(() => {
    return (
      generateClassName(props.widgetId) +
      " positioned-widget " +
      `t--widget-${props.widgetType
        .split("_")
        .join("")
        .toLowerCase()}`
    );
  }, [props.widgetType, props.widgetId]);
  const { onHoverZIndex, zIndex } = usePositionedContainerZIndex(props);

  const containerStyle: CSSProperties = useMemo(() => {
    return {
      position: "absolute",
      left: x,
      top: y,
      height: props.style.componentHeight + (props.style.heightUnit || "px"),
      width: props.style.componentWidth + (props.style.widthUnit || "px"),
      padding: padding + "px",
      zIndex,
      backgroundColor: "inherit",
    };
  }, [props.style, onHoverZIndex, zIndex]);

  const openPropPane = useCallback(
    (e) => {
      openPropertyPane(e, props.widgetId);
    },
    [props.widgetId, openPropertyPane],
  );

  // TODO: Experimental fix for sniping mode. This should be handled with a single event
  const stopEventPropagation = (e: any) => {
    !isSnipingMode && e.stopPropagation();
  };

  return (
    <PositionedWidget
      className={containerClassName}
      data-testid="test-widget"
      id={props.widgetId}
      key={`positioned-container-${props.widgetId}`}
      // Positioned Widget is the top enclosure for all widgets and clicks on/inside the widget should not be propogated/bubbled out of this Container.
      onClick={stopEventPropagation}
      onClickCapture={openPropPane}
      //Before you remove: This is used by property pane to reference the element
      style={containerStyle}
      zIndexOnHover={onHoverZIndex}
    >
      {props.children}
    </PositionedWidget>
  );
}

PositionedContainer.padding = WIDGET_PADDING;

export default PositionedContainer;
