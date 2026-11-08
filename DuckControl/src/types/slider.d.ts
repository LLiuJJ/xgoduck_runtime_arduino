/** Type override for @react-native-community/slider.
 *  The original types return ReactNode which is incompatible with
 *  React 18 JSX element types. This declaration patches the return type. */

declare module '@react-native-community/slider' {
  import * as React from 'react';
  interface SliderProps {
    disabled?: boolean;
    maximumTrackTintColor?: string;
    maximumValue?: number;
    lowerLimit?: number;
    upperLimit?: number;
    minimumTrackTintColor?: string;
    minimumValue?: number;
    onSlidingStart?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
    onValueChange?: (value: number) => void;
    step?: number;
    style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
    testID?: string;
    value?: number;
    inverted?: boolean;
    thumbSize?: number;
    thumbTintColor?: string;
    thumbImage?: import('react-native').ImageURISource;
    tapToSeek?: boolean;
    vertical?: boolean;
    maximumTrackImage?: import('react-native').ImageURISource;
    minimumTrackImage?: import('react-native').ImageURISource;
    trackImage?: import('react-native').ImageURISource;
    accessibilityUnits?: string;
    accessibilityIncrements?: string[];
  }
  const Slider: React.FC<SliderProps>;
  export default Slider;
}
