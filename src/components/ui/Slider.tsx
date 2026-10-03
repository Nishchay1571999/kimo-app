import NativeSlider, { type SliderProps as NativeSliderProps } from '@react-native-community/slider';
import { StyleSheet, type ViewStyle } from 'react-native';

import { cn } from '@/utils/lib';

export type SliderProps = Omit<NativeSliderProps, 'minimumValue' | 'maximumValue' | 'onSlidingComplete' | 'ref'> & {
  min?: number;
  max?: number;
  onValueCommit?: (value: number) => void;
};

export function Slider({
  min = 0, max = 100, step = 1, value = min, style, onValueCommit, ...props
}: SliderProps) {
  return (
    <NativeSlider
      minimumValue={min}
      maximumValue={max}
      step={step}
      value={value}
      minimumTrackTintColor="#18181B"
      maximumTrackTintColor="#E4E4E7"
      thumbTintColor="#18181B"
      thumbSize={22}
      tapToSeek
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      onSlidingComplete={onValueCommit}
      style={cn<ViewStyle>(styles.slider, style)}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  slider: { width: '100%', height: 48 },
});
