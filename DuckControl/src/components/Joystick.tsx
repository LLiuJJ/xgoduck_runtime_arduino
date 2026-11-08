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

  // Refs to avoid stale closures in memoized PanResponder
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onReleaseRef = useRef(onRelease);
  onReleaseRef.current = onRelease;

  // Records the touch offset from center at grant time
  const grantOffsetRef = useRef({x: 0, y: 0});

  const applyPosition = useCallback(
    (dx: number, dy: number) => {
      const distance = Math.hypot(dx, dy);
      let clampedDx = dx;
      let clampedDy = dy;
      if (distance > maxRadius) {
        clampedDx = (dx * maxRadius) / distance;
        clampedDy = (dy * maxRadius) / distance;
      }
      knobPos.setValue({x: clampedDx, y: clampedDy});
      const nx = clampedDx / maxRadius;
      const ny = -clampedDy / maxRadius;
      onMoveRef.current(nx, ny);
    },
    [maxRadius, knobPos],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: evt => {
          // Record initial touch offset from center (locationX/Y used once here)
          const centerX = size / 2;
          const centerY = size / 2;
          const dx = evt.nativeEvent.locationX - centerX;
          const dy = evt.nativeEvent.locationY - centerY;
          grantOffsetRef.current = {x: dx, y: dy};
          applyPosition(dx, dy);
        },
        onPanResponderMove: (_evt, gestureState) => {
          // Use ONLY gestureState deltas — locationX/Y jumps when finger
          // crosses child views (knob, crosshairs) on Android
          const dx = grantOffsetRef.current.x + gestureState.dx;
          const dy = grantOffsetRef.current.y + gestureState.dy;
          applyPosition(dx, dy);
        },
        onPanResponderRelease: () => {
          Animated.spring(knobPos, {
            toValue: {x: 0, y: 0},
            useNativeDriver: false,
            tension: 40,
            friction: 8,
          }).start();
          onReleaseRef.current();
        },
        onPanResponderTerminate: () => {
          Animated.spring(knobPos, {
            toValue: {x: 0, y: 0},
            useNativeDriver: false,
          }).start();
          onReleaseRef.current();
        },
      }),
    [disabled, size, applyPosition],
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
        {/* Crosshair lines — pointerEvents none so they don't steal touch */}
        <View pointerEvents="none" style={[styles.crossH, {width: size, top: size / 2 - 0.5}]} />
        <View pointerEvents="none" style={[styles.crossV, {height: size, left: size / 2 - 0.5}]} />
        {/* Knob — pointerEvents none so it doesn't steal touch */}
        <Animated.View
          pointerEvents="none"
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
