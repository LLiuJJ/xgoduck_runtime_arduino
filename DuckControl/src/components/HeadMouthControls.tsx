/** Head and mouth controls: 4 head sliders + 1 mouth slider.
 *  Mirrors index.html line 20 head-controls section. */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider';
import {useRobotStore} from '../store/robotStore';
import {useTranslation} from '../i18n';
import {colors} from '../theme/colors';
import {Section, sharedStyles} from './ui';

export const HeadMouthControls: React.FC = () => {
  const {t} = useTranslation();
  const head = useRobotStore(s => s.head);
  const mouth = useRobotStore(s => s.mouth);
  const setHead = useRobotStore(s => s.setHead);
  const setMouth = useRobotStore(s => s.setMouth);
  const kickActive = useRobotStore(s => s.kickActive);
  const imuCalibrationActive = useRobotStore(s => s.imuCalibrationActive);
  const disabled = kickActive || imuCalibrationActive;

  return (
    <Section title={t('section.headMouth')}>
      <View style={styles.grid}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={styles.headItem}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>H{i + 1}</Text>
              <Text style={styles.value}>{head[i].toFixed(2)}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={-1}
              maximumValue={1}
              value={head[i]}
              step={0.02}
              disabled={disabled}
              minimumTrackTintColor={colors.knob}
              maximumTrackTintColor={colors.border}
              onValueChange={v => setHead(i, v)}
            />
          </View>
        ))}
        <View style={styles.mouthItem}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('slider.mouth')}</Text>
            <Text style={styles.value}>{mouth.toFixed(0)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={30}
            value={mouth}
            step={1}
            disabled={disabled}
            minimumTrackTintColor={colors.knob}
            maximumTrackTintColor={colors.border}
            onValueChange={v => setMouth(v)}
          />
        </View>
      </View>
    </Section>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  headItem: {
    width: '48%',
  },
  mouthItem: {
    width: '100%',
    marginTop: 2,
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
