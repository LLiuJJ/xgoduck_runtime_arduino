/** Action settings: Action scale, Leg smoothing, Head smoothing.
 *  Mirrors index.html line 22-25 action settings section. */

import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider';
import {useRobotStore} from '../store/robotStore';
import {useTranslation} from '../i18n';
import {colors} from '../theme/colors';
import {Section, sharedStyles} from './ui';

export const ActionSettings: React.FC = () => {
  const {t} = useTranslation();
  const status = useRobotStore(s => s.status);
  const client = useRobotStore(s => s.client);
  const setMessage = useRobotStore(s => s.setMessage);
  const rollerEnabled = useRobotStore(s => s.rollerEnabled);
  const imuCalibrationActive = useRobotStore(s => s.imuCalibrationActive);

  const dep = status?.deployment;
  const actionProfile = rollerEnabled ? 'Skating' : 'Walking / other models';

  const [scale, setScale] = useState(dep?.action_scale ?? 1);
  const [legAlpha, setLegAlpha] = useState(dep?.action_alpha ?? 0.35);
  const [headAlpha, setHeadAlpha] = useState(dep?.action_alpha_head ?? 0.45);

  // Sync from server when not actively editing
  React.useEffect(() => {
    if (dep) {
      setScale(dep.action_scale);
      setLegAlpha(dep.action_alpha);
      setHeadAlpha(dep.action_alpha_head);
    }
  }, [dep?.action_scale, dep?.action_alpha, dep?.action_alpha_head]);

  const disabled = imuCalibrationActive;

  return (
    <Section title={`${t('section.actionSettings')} · ${actionProfile}`}>
      <View style={styles.grid}>
        <View style={styles.sliderItem}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('slider.actionScale')}</Text>
            <Text style={styles.value}>{scale.toFixed(2)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={2}
            value={scale}
            step={0.05}
            disabled={disabled}
            minimumTrackTintColor={colors.knob}
            maximumTrackTintColor={colors.border}
            onValueChange={v => setScale(v)}
            onSlidingComplete={async v => {
              if (!client) return;
              try {
                await client.setActionScale(v);
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          />
        </View>
        <View style={styles.sliderItem}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('slider.legSmoothing')}</Text>
            <Text style={styles.value}>{legAlpha.toFixed(2)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={0.95}
            value={legAlpha}
            step={0.05}
            disabled={disabled}
            minimumTrackTintColor={colors.knob}
            maximumTrackTintColor={colors.border}
            onValueChange={v => setLegAlpha(v)}
            onSlidingComplete={async v => {
              if (!client) return;
              try {
                await client.setFilter(v, headAlpha);
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          />
        </View>
        <View style={styles.sliderItem}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('slider.headSmoothing')}</Text>
            <Text style={styles.value}>{headAlpha.toFixed(2)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={0.95}
            value={headAlpha}
            step={0.05}
            disabled={disabled}
            minimumTrackTintColor={colors.knob}
            maximumTrackTintColor={colors.border}
            onValueChange={v => setHeadAlpha(v)}
            onSlidingComplete={async v => {
              if (!client) return;
              try {
                await client.setFilter(legAlpha, v);
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          />
        </View>
      </View>
    </Section>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: 4,
  },
  sliderItem: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  value: {
    color: colors.accent,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  slider: {
    width: '100%',
    height: 20,
    marginVertical: 1,
  },
});
