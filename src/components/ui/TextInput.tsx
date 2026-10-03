// components/ui/input.tsx

import { cn } from "@/utils/lib";
import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
    type TextProps,
    type ViewProps,
} from "react-native";



type InputProps = TextInputProps & {
  invalid?: boolean;
};

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      style,
      invalid = false,
      editable = true,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = React.useState(false);

    return (
      <TextInput
        ref={ref}
        editable={editable}
        placeholderTextColor="#A1A1AA"
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={cn(
          styles.input,
          focused && styles.inputFocused,
          invalid && styles.inputInvalid,
          !editable && styles.inputDisabled,
          style
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

function InputField({ style, ...props }: ViewProps) {
  return <View style={cn(styles.field, style)} {...props} />;
}

function InputLabel({ style, ...props }: TextProps) {
  return <Text style={cn(styles.label, style)} {...props} />;
}

function InputDescription({ style, ...props }: TextProps) {
  return <Text style={cn(styles.description, style)} {...props} />;
}

function InputError({ style, ...props }: TextProps) {
  return <Text style={cn(styles.error, style)} {...props} />;
}

function InputGroup({ style, ...props }: ViewProps) {
  return <View style={cn(styles.group, style)} {...props} />;
}

function InputPrefix({ style, ...props }: ViewProps) {
  return <View style={cn(styles.prefix, style)} {...props} />;
}

function InputSuffix({ style, ...props }: ViewProps) {
  return <View style={cn(styles.suffix, style)} {...props} />;
}

const styles = StyleSheet.create({
  field: {
    width: "100%",
    gap: 6,
  },
  input: {
  minHeight: 48,

  paddingHorizontal: 14,
  paddingVertical: 12,

  fontSize: 16,
  lineHeight: 22,

  color: "#18181B",
  backgroundColor: "#FFFFFF",

  borderWidth: 1,
  borderColor: "#E4E4E7",
  borderRadius: 10,
},

inputFocused: {
  borderColor: "#18181B",
},

inputInvalid: {
  borderColor: "#DC2626",
},

inputDisabled: {
  opacity: 0.5,
},
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#111827",
  },

  description: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
  },

  error: {
    fontSize: 13,
    lineHeight: 18,
    color: "#DC2626",
  },

  group: {
    position: "relative",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  prefix: {
    paddingLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  suffix: {
    paddingRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

export {
    Input,
    InputDescription,
    InputError,
    InputField,
    InputGroup,
    InputLabel,
    InputPrefix,
    InputSuffix
};
