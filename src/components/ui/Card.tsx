// components/ui/card.tsx

import { cn } from "@/utils/lib";
import {
    StyleSheet,
    Text,
    type TextProps,
    type TextStyle,
    View,
    type ViewProps,
    type ViewStyle,
} from "react-native";


function Card({ style, ...props }: ViewProps) {
  return (
    <View
      style={cn<ViewStyle>(styles.card, style)}
      {...props}
    />
  );
}

function CardHeader({ style, ...props }: ViewProps) {
  return (
    <View
      style={cn<ViewStyle>(styles.header, style)}
      {...props}
    />
  );
}

function CardTitle({ style, ...props }: TextProps) {
  return (
    <Text
      style={cn<TextStyle>(styles.title, style)}
      {...props}
    />
  );
}

function CardDescription({ style, ...props }: TextProps) {
  return (
    <Text
      style={cn<TextStyle>(styles.description, style)}
      {...props}
    />
  );
}

function CardAction({ style, ...props }: ViewProps) {
  return (
    <View
      style={cn<ViewStyle>(styles.action, style)}
      {...props}
    />
  );
}

function CardContent({ style, ...props }: ViewProps) {
  return (
    <View
      style={cn<ViewStyle>(styles.content, style)}
      {...props}
    />
  );
}

function CardFooter({ style, ...props }: ViewProps) {
  return (
    <View
      style={cn<ViewStyle>(styles.footer, style)}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    flexDirection: "column",
    gap: 24,

    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",

    backgroundColor: "#FFFFFF",

    paddingVertical: 24,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,

    elevation: 1,
  },

  header: {
    position: "relative",
    flexDirection: "column",
    gap: 6,

    paddingHorizontal: 24,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,

    color: "#111827",
  },

  description: {
    fontSize: 14,
    lineHeight: 20,

    color: "#6B7280",
  },

  action: {
    position: "absolute",
    top: 0,
    right: 24,
  },

  content: {
    paddingHorizontal: 24,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 24,
  },
});

export {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
};
