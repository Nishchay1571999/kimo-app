// components/ui/button.tsx

import { cn } from "@/utils/lib";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    type PressableProps,
    type StyleProp,
    type TextProps,
    type TextStyle,
    type ViewStyle,
} from "react-native";


export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSize =
  | "default"
  | "sm"
  | "lg"
  | "icon";

type ButtonContextValue = {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
};

const ButtonContext =
  React.createContext<ButtonContextValue>({
    variant: "default",
    size: "default",
    disabled: false,
  });

type ButtonVariants = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
};

export function buttonVariants({
  variant = "default",
  size = "default",
  disabled = false,
}: ButtonVariants = {}): StyleProp<ViewStyle> {
  return cn<ViewStyle>(
    styles.base,

    buttonVariantStyles[variant],
    buttonSizeStyles[size],

    disabled && styles.disabled
  );
}

export function buttonTextVariants({
  variant = "default",
  size = "default",
  disabled = false,
}: ButtonVariants = {}): StyleProp<TextStyle> {
  return cn<TextStyle>(
    styles.textBase,

    buttonTextVariantStyles[variant],
    buttonTextSizeStyles[size],

    disabled && styles.textDisabled
  );
}

type ButtonProps = Omit<PressableProps, "style"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;

  loading?: boolean;

  style?: StyleProp<ViewStyle>;
};

function Button({
  variant = "default",
  size = "default",
  disabled = false,
  loading = false,
  style,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <ButtonContext.Provider
      value={{
        variant,
        size,
        disabled: isDisabled,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: isDisabled,
          busy: loading,
        }}
        disabled={isDisabled}
        style={({ pressed }) =>
          cn(
            buttonVariants({
              variant,
              size,
              disabled: isDisabled,
            }),

            pressed && !isDisabled && styles.pressed,

            style
          )
        }
        {...props}
      >
        {(state) => (
          <>
            {loading && (
              <ActivityIndicator
                size="small"
                color={getLoaderColor(variant)}
              />
            )}

            {typeof children === "function" ? children(state) : children}
          </>
        )}
      </Pressable>
    </ButtonContext.Provider>
  );
}

function ButtonText({
  style,
  ...props
}: TextProps) {
  const {
    variant,
    size,
    disabled,
  } = React.useContext(ButtonContext);

  return (
    <Text
      style={cn(
        buttonTextVariants({
          variant,
          size,
          disabled,
        }),
        style
      )}
      {...props}
    />
  );
}

const buttonVariantStyles: Record<
  ButtonVariant,
  ViewStyle
> = {
  default: {
    backgroundColor: "#18181B",
  },

  destructive: {
    backgroundColor: "#DC2626",
  },

  outline: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E4E4E7",
  },

  secondary: {
    backgroundColor: "#F4F4F5",
  },

  ghost: {
    backgroundColor: "transparent",
  },

  link: {
    backgroundColor: "transparent",
  },
};

const buttonTextVariantStyles: Record<
  ButtonVariant,
  TextStyle
> = {
  default: {
    color: "#FAFAFA",
  },

  destructive: {
    color: "#FFFFFF",
  },

  outline: {
    color: "#18181B",
  },

  secondary: {
    color: "#18181B",
  },

  ghost: {
    color: "#18181B",
  },

  link: {
    color: "#18181B",
    textDecorationLine: "underline",
    lineHeight: 40,
  },
};

const buttonSizeStyles: Record<
  ButtonSize,
  ViewStyle
> = {
  default: {
    minHeight: 40,

    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  sm: {
    minHeight: 36,

    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  lg: {
    minHeight: 44,

    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  icon: {
    width: 40,
    height: 40,

    paddingHorizontal: 0,
    paddingVertical: 0,
  },
};

const buttonTextSizeStyles: Record<
  ButtonSize,
  TextStyle
> = {
  default: {
    fontSize: 14,
    lineHeight: 20,
  },

  sm: {
    fontSize: 13,
    lineHeight: 18,
  },

  lg: {
    fontSize: 16,
    lineHeight: 22,
  },

  icon: {
    fontSize: 14,
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    borderRadius: 8,
  },

  pressed: {
    opacity: 0.85,
  },

  disabled: {
    opacity: 0.5,
  },

  textBase: {
    fontWeight: "500",
    textAlign: "center",
  },

  textDisabled: {
    opacity: 0.8,
  },
});

function getLoaderColor(
  variant: ButtonVariant
) {
  switch (variant) {
    case "default":
    case "destructive":
      return "#FFFFFF";

    case "outline":
    case "secondary":
    case "ghost":
    case "link":
      return "#18181B";
  }
}

export {
    Button,
    ButtonText
};
