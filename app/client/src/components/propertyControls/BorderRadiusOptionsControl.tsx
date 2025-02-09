import * as React from "react";
import styled from "styled-components";
import { Button, ButtonGroup, IButtonProps } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ControlIcons } from "icons/ControlIcons";
import { ThemeProp } from "components/ads/common";
import {
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
} from "components/designSystems/appsmith/IconButtonComponent";

const StyledButtonGroup = styled(ButtonGroup)`
  height: 33px;
`;

const StyledButton = styled(Button)<ThemeProp & IButtonProps>`
  border: ${(props) =>
    props.active ? `1px solid #6A86CE` : `1px solid #A9A7A7`};
  border-radius: 0;
  box-shadow: none !important;
  background-image: none !important;
  background-color: #ffffff !important;
  & > div {
    display: flex;
  }
  &.bp3-active {
    box-shadow: none !important;
    background-color: #ffffff !important;
  }
  &:hover {
    background-color: #ffffff !important;
  }
`;

export interface BorderRadiusOptionsControlProps extends ControlProps {
  propertyValue: ButtonBorderRadius | undefined;
  onChange: (borderRaidus: ButtonBorderRadius) => void;
}

class BorderRadiusOptionsControl extends BaseControl<
  BorderRadiusOptionsControlProps
> {
  constructor(props: BorderRadiusOptionsControlProps) {
    super(props);
  }

  static getControlType() {
    return "BORDER_RADIUS_OPTIONS";
  }

  public render() {
    const { propertyValue } = this.props;

    return (
      <StyledButtonGroup fill>
        <StyledButton
          active={propertyValue === ButtonBorderRadiusTypes.SHARP || undefined}
          icon={<ControlIcons.BORDER_RADIUS_SHARP color="#979797" width={15} />}
          large
          onClick={() => this.toggleOption(ButtonBorderRadiusTypes.SHARP)}
        />
        <StyledButton
          active={propertyValue === ButtonBorderRadiusTypes.ROUNDED}
          icon={
            <ControlIcons.BORDER_RADIUS_ROUNDED color="#979797" width={15} />
          }
          large
          onClick={() => this.toggleOption(ButtonBorderRadiusTypes.ROUNDED)}
        />
        <StyledButton
          active={propertyValue === ButtonBorderRadiusTypes.CIRCLE}
          icon={
            <ControlIcons.BORDER_RADIUS_CIRCLE color="#979797" width={15} />
          }
          large
          onClick={() => this.toggleOption(ButtonBorderRadiusTypes.CIRCLE)}
        />
      </StyledButtonGroup>
    );
  }

  private toggleOption = (option: ButtonBorderRadius) => {
    this.updateProperty(this.props.propertyName, option);
  };
}

export default BorderRadiusOptionsControl;
