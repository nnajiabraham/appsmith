import React from "react";
import styled from "styled-components";
import {
  getBorderCSSShorthand,
  IntentColors,
  labelStyle,
} from "constants/DefaultTheme";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import {
  Intent,
  NumericInput,
  IconName,
  InputGroup,
  Button,
  Label,
  Classes,
  ControlGroup,
  TextArea,
} from "@blueprintjs/core";
import { InputType, InputTypes } from "widgets/InputWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { Colors } from "constants/Colors";
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import _ from "lodash";
import {
  createMessage,
  INPUT_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "constants/messages";
import CurrencyTypeDropdown, {
  CurrencyDropdownOptions,
  getSelectedCurrency,
} from "components/ads/CurrencyCodeDropdown";
import ISDCodeDropdown, {
  ISDCodeDropdownOptions,
  getSelectedISDCode,
} from "components/ads/ISDCodeDropdown";
/**
 * All design system component specific logic goes here.
 * Ex. Blueprint has a separate numeric input and text input so switching between them goes here
 * Ex. To set the icon as currency, blue print takes in a set of defined types
 * All generic logic like max characters for phone numbers should be 10, should go in the widget
 */

const InputComponentWrapper = styled((props) => (
  <ControlGroup {..._.omit(props, ["hasError", "numeric"])} />
))<{
  numeric: boolean;
  multiline: string;
  hasError: boolean;
  allowCurrencyChange?: boolean;
  inputType: InputType;
}>`
  &&&& {
    .currency-type-filter,
    .country-type-filter {
      width: 40px;
      height: 32px;
      position: absolute;
      display: inline-block;
      left: 0;
      z-index: 16;
      svg {
        path {
          fill: ${(props) => props.theme.colors.icon?.hover};
        }
      }
    }
    .${Classes.INPUT} {
      ${(props) =>
        props.inputType === InputTypes.CURRENCY &&
        props.allowCurrencyChange &&
        `
      padding-left: 45px;`};
      ${(props) =>
        props.inputType === InputTypes.CURRENCY &&
        !props.allowCurrencyChange &&
        `
      padding-left: 35px;`};
      ${(props) =>
        props.inputType === InputTypes.PHONE_NUMBER && `padding-left: 85px;`};
      box-shadow: none;
      border: 1px solid;
      border-color: ${({ hasError }) =>
        hasError ? IntentColors.danger : Colors.GEYSER_LIGHT};
      border-radius: 0;
      height: ${(props) => (props.multiline === "true" ? "100%" : "inherit")};
      width: 100%;
      ${(props) =>
        props.numeric &&
        `
        border-top-right-radius: 0px;
        border-bottom-right-radius: 0px;
        border-right-width: 0px;
      `}
      transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
      &:active {
        border-color: ${({ hasError }) =>
          hasError ? IntentColors.danger : Colors.HIT_GRAY};
      }
      &:focus {
        border-color: ${({ hasError }) =>
          hasError ? IntentColors.danger : Colors.MYSTIC};

        &:focus {
          border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.1rem rgba(0, 123, 255, 0.25);
        }
      }
    }
    .${Classes.INPUT_GROUP} {
      display: block;
      margin: 0;
    }
    .${Classes.CONTROL_GROUP} {
      justify-content: flex-start;
    }
    height: 100%;
    align-items: center;
    label {
      ${labelStyle}
      flex: 0 1 30%;
      margin: 7px ${WIDGET_PADDING * 2}px 0 0;
      text-align: right;
      align-self: flex-start;
      max-width: calc(30% - ${WIDGET_PADDING}px);
    }
  }
`;

export const isNumberInputType = (inputType: InputType) => {
  return (
    inputType === "INTEGER" ||
    inputType === "NUMBER" ||
    inputType === "CURRENCY" ||
    inputType === "PHONE_NUMBER"
  );
};
class InputComponent extends React.Component<
  InputComponentProps,
  InputComponentState
> {
  constructor(props: InputComponentProps) {
    super(props);
    this.state = { showPassword: false };
  }

  setFocusState = (isFocused: boolean) => {
    this.props.onFocusChange(isFocused);
  };

  onTextChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    this.props.onValueChange(event.target.value);
  };

  onNumberChange = (valueAsNum: number, valueAsString: string) => {
    if (this.props.inputType === InputTypes.CURRENCY) {
      const fractionDigits = this.props.decimalsInCurrency || 0;
      const locale = navigator.languages?.[0] || "en-US";
      if (!valueAsString.endsWith(".")) {
        const value = parseFloat(valueAsString.split(",").join(""));
        if (value) {
          const formatter = new Intl.NumberFormat(locale, {
            style: "decimal",
            maximumFractionDigits: fractionDigits,
          });
          const formattedValue = formatter.format(value);
          this.props.onValueChange(formattedValue);
        } else {
          this.props.onValueChange("");
        }
      } else {
        this.props.onValueChange(valueAsString);
      }
    } else {
      this.props.onValueChange(valueAsString);
    }
  };

  getLeftIcon = (inputType: InputType, disabled: boolean) => {
    if (inputType === InputTypes.PHONE_NUMBER) {
      const selectedISDCode = getSelectedISDCode(
        this.props.phoneNumberCountryCode,
      );
      return (
        <ISDCodeDropdown
          disabled={disabled}
          onISDCodeChange={this.props.onISDCodeChange}
          options={ISDCodeDropdownOptions}
          selected={selectedISDCode}
        />
      );
    } else if (inputType === InputTypes.CURRENCY) {
      const selectedCurrencyCountryCode = getSelectedCurrency(
        this.props.currencyCountryCode,
      );
      return (
        <CurrencyTypeDropdown
          allowCurrencyChange={this.props.allowCurrencyChange && !disabled}
          onCurrencyTypeChange={this.props.onCurrencyTypeChange}
          options={CurrencyDropdownOptions}
          selected={selectedCurrencyCountryCode}
        />
      );
    }
    return this.props.leftIcon;
  };

  getIcon(inputType: InputType) {
    switch (inputType) {
      case "SEARCH":
        return "search";
      case "EMAIL":
        return "envelope";
      default:
        return undefined;
    }
  }

  getType(inputType: InputType) {
    switch (inputType) {
      case "PASSWORD":
        return this.state.showPassword ? "text" : "password";
      case "EMAIL":
        return "email";
      case "SEARCH":
        return "search";
      default:
        return "text";
    }
  }
  onKeyDownTextArea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isEnterKey = e.key === "Enter" || e.keyCode === 13;
    const { disableNewLineOnPressEnterKey } = this.props;
    if (isEnterKey && disableNewLineOnPressEnterKey && !e.shiftKey) {
      e.preventDefault();
    }
    if (typeof this.props.onKeyDown === "function") {
      this.props.onKeyDown(e);
    }
  };
  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof this.props.onKeyDown === "function") {
      this.props.onKeyDown(e);
    }
  };

  private numericInputComponent = () => {
    const leftIcon = this.getLeftIcon(
      this.props.inputType,
      !!this.props.disabled,
    );
    return (
      <NumericInput
        allowNumericCharactersOnly
        className={this.props.isLoading ? "bp3-skeleton" : Classes.FILL}
        disabled={this.props.disabled}
        intent={this.props.intent}
        leftIcon={leftIcon}
        max={this.props.maxNum}
        maxLength={this.props.maxChars}
        min={
          this.props.inputType === InputTypes.PHONE_NUMBER
            ? 0
            : this.props.minNum
        }
        onBlur={() => this.setFocusState(false)}
        onFocus={() => this.setFocusState(true)}
        onKeyDown={this.onKeyDown}
        onValueChange={this.onNumberChange}
        placeholder={this.props.placeholder}
        stepSize={this.props.stepSize}
        value={this.props.value}
      />
    );
  };

  private textAreaInputComponent = () => (
    <TextArea
      className={this.props.isLoading ? "bp3-skeleton" : ""}
      disabled={this.props.disabled}
      growVertically={false}
      intent={this.props.intent}
      maxLength={this.props.maxChars}
      onBlur={() => this.setFocusState(false)}
      onChange={this.onTextChange}
      onFocus={() => this.setFocusState(true)}
      onKeyDown={this.onKeyDownTextArea}
      placeholder={this.props.placeholder}
      style={{ resize: "none" }}
      value={this.props.value}
    />
  );

  private textInputComponent = (isTextArea: boolean) =>
    isTextArea ? (
      this.textAreaInputComponent()
    ) : (
      <InputGroup
        className={this.props.isLoading ? "bp3-skeleton" : ""}
        disabled={this.props.disabled}
        intent={this.props.intent}
        maxLength={this.props.maxChars}
        onBlur={() => this.setFocusState(false)}
        onChange={this.onTextChange}
        onFocus={() => this.setFocusState(true)}
        onKeyDown={this.onKeyDown}
        placeholder={this.props.placeholder}
        rightElement={
          this.props.inputType === "PASSWORD" ? (
            <Button
              icon={"lock"}
              onClick={() => {
                this.setState({ showPassword: !this.state.showPassword });
              }}
            />
          ) : (
            undefined
          )
        }
        type={this.getType(this.props.inputType)}
        value={this.props.value}
      />
    );
  private renderInputComponent = (inputType: InputType, isTextArea: boolean) =>
    isNumberInputType(inputType)
      ? this.numericInputComponent()
      : this.textInputComponent(isTextArea);

  render() {
    return (
      <InputComponentWrapper
        allowCurrencyChange={this.props.allowCurrencyChange}
        fill
        hasError={this.props.isInvalid}
        inputType={this.props.inputType}
        multiline={this.props.multiline.toString()}
        numeric={isNumberInputType(this.props.inputType)}
      >
        {this.props.label && (
          <Label
            className={
              this.props.isLoading
                ? Classes.SKELETON
                : Classes.TEXT_OVERFLOW_ELLIPSIS
            }
          >
            {this.props.label}
          </Label>
        )}
        <ErrorTooltip
          isOpen={this.props.isInvalid && this.props.showError}
          message={
            this.props.errorMessage ||
            createMessage(INPUT_WIDGET_DEFAULT_VALIDATION_ERROR)
          }
        >
          {this.renderInputComponent(
            this.props.inputType,
            this.props.multiline,
          )}
        </ErrorTooltip>
      </InputComponentWrapper>
    );
  }
}

export interface InputComponentState {
  showPassword?: boolean;
}

export interface InputComponentProps extends ComponentProps {
  value: string;
  inputType: InputType;
  disabled?: boolean;
  intent?: Intent;
  defaultValue?: string;
  currencyCountryCode?: string;
  noOfDecimals?: number;
  phoneNumberCountryCode?: string;
  allowCurrencyChange?: boolean;
  decimalsInCurrency?: number;
  label: string;
  leftIcon?: IconName;
  allowNumericCharactersOnly?: boolean;
  fill?: boolean;
  errorMessage?: string;
  maxChars?: number;
  maxNum?: number;
  minNum?: number;
  onValueChange: (valueAsString: string) => void;
  onCurrencyTypeChange: (code?: string) => void;
  onISDCodeChange: (code?: string) => void;
  stepSize?: number;
  placeholder?: string;
  isLoading: boolean;
  multiline: boolean;
  isInvalid: boolean;
  showError: boolean;
  onFocusChange: (state: boolean) => void;
  disableNewLineOnPressEnterKey?: boolean;
  onKeyDown?: (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => void;
}

export default InputComponent;
