/** Virtual joystick component using PanResponder.
 *  Mirrors the web joystick behavior in assets/app.js (joystick function, lines 136–157):
 *  - Circular touch zone, knob follows finger, clamped to radius
 *  - On release, knob returns to center and values zero out
 *  - Callbacks provide normalized x (-1..1) and y (-1..1)
 *  - Deadzone applied by parent (see store) */

import React, {useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  DimensionValue,
} from 'react-native';
import {colors} from '../theme/colors';

interface JoystickProps {
  size?: number;
  label: string;
  valueLabel?: string;
  disabled?: boolean;
  onMove: (x: number, y: number) => void;
  onRelease: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({
  size = 160,
  label,
  valueLabel,
  disabled = false,
  onMove,
  onRelease,
}) => {
  const knobSize = size * 0.34;
  const maxRadius = (size - knobSize) / 2;
  const knobPos = useRef(new Animated.ValueXY({x: 0, y: 0})).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: evt => {
          // Calculate initial offset from center
          handleMove(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderMove: (evt, gestureState) => {
          // Use gesture state delta from the initial touch point
          // locationX/locationY can be unreliable on some platforms,
          // so we use the grant point + gestureState.dx/dy
          const cx = evt.nativeEvent.locationX - gestureState.dx;
          const cy = evt.nativeEvent.locationY - gestureState.dy;
          handleMove(cx + gestureState.dx, cy + gestureState.dy);
        },
        onPanResponderRelease: () => {
          Animated.spring(knobPos, {
            toValue: {x: 0, y: 0},
            useNativeDriver: false,
            tension: 40,
            friction: 8,
          }).start();
          onRelease();
        },
        onPanResponderTerminate: () => {
          Animated.spring(knobPos, {
            toValue: {x: 0, y: 0},
            useNativeDriver: false,
          }).start();
          onRelease();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, size],
  );

  const handleMove = useCallback(
    (locationX: number, locationY: number) => {
      // Center of the joystick zone
      const centerX = size / 2;
      const centerY = size / 2;
      let dx = locationX - centerX;
      let dy = locationY - centerY;
      const distance = Math.hypot(dx, dy);
      if (distance > maxRadius) {
        dx = (dx * maxRadius) / distance;
        dy = (dy * maxRadius) / distance;
      }
      knobPos.setValue({x: dx, y: dy});
      // Normalized values: x = right positive, y = up positive (inverted)
      const nx = dx / maxRadius;
      const ny = -dy / maxRadius; // invert Y so up = positive
      onMove(nx, ny);
    },
    [maxRadius, onMove, size, knobPos],
  );

  return (
    <View style={styles.side}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.zone,
          {
            width: size as DimensionValue,
            height: size as DimensionValue,
            borderRadius: size / 2,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        {...panResponder.panHandlers}>
        {/* Crosshair lines */}
        <View style={[styles.crossH, {width: size, top: size / 2 - 0.5}]} />
        <View style={[styles.crossV, {height: size, left: size / 2 - 0.5}]} />
        {/* Knob */}
        <Animated.View
          style={[
            styles.knob,
            {
              width: knobSize as DimensionValue,
              height: knobSize as DimensionValue,
              borderRadius: knobSize / 2,
              left: (size - knobSize) / 2,
              top: (size - knobSize) / 2,
              transform: knobPos.getTranslateTransform(),
            },
          ]}
        />
      </View>
      {valueLabel ? (
        <Text style={styles.valueText}>{valueLabel}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  side: {
    alignItems: 'center',
    minWidth: 0,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  zone: {
    backgroundColor: colors.joyZone,
    borderWidth: 2,
    borderColor: colors.joyBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  crossH: {
    position: 'absolute',
    height: 1,
    backgroundColor: colors.joyBorder,
    opacity: 0.4,
  },
  crossV: {
    position: 'absolute',
    width: 1,
    backgroundColor: colors.joyBorder,
    opacity: 0.4,
  },
  knob: {
    position: 'absolute',
    backgroundColor: colors.knob,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  valueText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.accent,
    marginTop: 6,
  },
});
