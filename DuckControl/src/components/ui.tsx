/** Shared UI styles and primitives matching the web theme in style.css. */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {colors} from '../theme/colors';

/** Cross-platform shadow helper (iOS + Android elevation). */
function shadowStyle(
  color: string,
  opacity: number,
  offsetY: number,
  blur: number,
  elevation: number,
): Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'> {
  return {
    shadowColor: color,
    shadowOffset: {width: 0, height: offsetY},
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
}

export const sharedStyles = StyleSheet.create({
  section: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: colors.text,
    marginBottom: 6,
  } as TextStyle,
  hint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  } as TextStyle,
  button: {
    backgroundColor: colors.button,
    borderWidth: 0,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
  } as TextStyle,
  buttonDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  dangerButton: {
    backgroundColor: colors.danger,
    borderColor: colors.dangerBorder,
  } as ViewStyle,
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.joyBorder,
    borderRadius: 8,
  } as ViewStyle,
  toggleText: {
    color: colors.accent,
    fontSize: 14,
    minWidth: 20,
  } as TextStyle,
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  } as ViewStyle,
  message: {
    color: colors.warning,
    fontSize: 13,
    minHeight: 18,
  } as TextStyle,
  warnBox: {
    backgroundColor: colors.warnBg,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  } as ViewStyle,
  warnText: {
    color: colors.warning,
    fontSize: 13,
  } as TextStyle,
});

/** A themed button with premium styling — depth shadows, press states, and variants. */
type BtnVariant = 'primary' | 'ghost' | 'danger';
interface BtnProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
  variant?: BtnVariant;
  style?: ViewStyle;
}

const btnBase: ViewStyle = {
  borderRadius: 10,
  paddingVertical: 7,
  paddingHorizontal: 12,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 34,
};

const btnPrimary: ViewStyle = {
  backgroundColor: colors.button,
  ...shadowStyle(colors.buttonShadow, 0.18, 3, 4, 3),
};

const btnPrimaryPressed: ViewStyle = {
  backgroundColor: colors.buttonPressed,
  ...shadowStyle(colors.buttonShadow, 0.12, 1, 2, 2),
};

const btnGhost: ViewStyle = {
  backgroundColor: colors.buttonGhost,
  borderWidth: 1,
  borderColor: colors.buttonGhostBorder,
  ...shadowStyle('#000000', 0.06, 1, 3, 2),
};

const btnGhostPressed: ViewStyle = {
  backgroundColor: '#e2e6ee',
};

const btnDanger: ViewStyle = {
  backgroundColor: colors.danger,
  ...shadowStyle(colors.dangerPressed, 0.18, 3, 4, 3),
};

const btnDangerPressed: ViewStyle = {
  backgroundColor: colors.dangerPressed,
  ...shadowStyle(colors.dangerPressed, 0.12, 1, 2, 2),
};

const btnDisabled: ViewStyle = {
  opacity: 0.38,
};

const btnTextPrimary: TextStyle = {
  color: '#ffffff',
  fontSize: 12,
  fontWeight: '600',
  letterSpacing: 0.3,
};

const btnTextGhost: TextStyle = {
  color: colors.buttonGhostText,
  fontSize: 12,
  fontWeight: '600',
  letterSpacing: 0.3,
};

const btnTextDanger: TextStyle = {
  color: '#ffffff',
  fontSize: 12,
  fontWeight: '600',
  letterSpacing: 0.3,
};

export const Btn: React.FC<BtnProps> = ({
  title,
  onPress,
  disabled,
  danger,
  variant,
  style,
}) => {
  const resolvedVariant: BtnVariant = danger ? 'danger' : variant ?? 'primary';

  const baseStyle = resolvedVariant === 'ghost' ? btnGhost : resolvedVariant === 'danger' ? btnDanger : btnPrimary;
  const pressedStyle = resolvedVariant === 'ghost' ? btnGhostPressed : resolvedVariant === 'danger' ? btnDangerPressed : btnPrimaryPressed;
  const textStyle = resolvedVariant === 'ghost' ? btnTextGhost : resolvedVariant === 'danger' ? btnTextDanger : btnTextPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        btnBase,
        baseStyle,
        pressed && pressedStyle,
        disabled && btnDisabled,
        style,
      ]}>
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
};

/** A section card with a title. */
interface SectionProps {
  title?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({title, children, right}) => (
  <View style={sharedStyles.section}>
    {title ? (
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
        <Text style={sharedStyles.sectionTitle}>{title}</Text>
        {right}
      </View>
    ) : null}
    {children}
  </View>
);

/** Small label text used for metric captions etc. */
export const SmallText: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Text style={{color: colors.textSecondary, fontSize: 12}}>{children}</Text>
);
