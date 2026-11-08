/** IMU filtering: Gyro smoothing, Gravity smoothing.
 *  Mirrors index.html line 27-29 IMU filtering section. */

import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider';
import {useRobotStore} from '../store/robotStore';
import {useTranslation} from '../i18n';
import {colors} from '../theme/colors';
import {Section, sharedStyles} from './ui';

export const ImuFilters: React.FC = () => {
  const {t} = useTranslation();
  const status = useRobotStore(s => s.status);
  const client = useRobotStore(s => s.client);
  const setMessage = useRobotStore(s => s.setMessage);
  const imuCalibrationActive = useRobotStore(s => s.imuCalibrationActive);

  const dep = status?.deployment;
  const [gyroAlpha, setGyroAlpha] = useState(dep?.gyro_alpha ?? 0.5);
  const [gravityTau, setGravityTau] = useState(dep?.gravity_tau_s ?? 0.3);

  React.useEffect(() => {
    if (dep) {
      setGyroAlpha(dep.gyro_alpha);
      setGravityTau(dep.gravity_tau_s);
    }
  }, [dep?.gyro_alpha, dep?.gravity_tau_s]);

  const disabled = imuCalibrationActive;

  return (
    <Section title={t('section.imuFiltering')}>
      <View style={styles.grid}>
        <View style={styles.sliderItem}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('slider.gyroSmoothing')}</Text>
            <Text style={styles.value}>{gyroAlpha.toFixed(2)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={0.95}
            value={gyroAlpha}
            step={0.05}
            disabled={disabled}
            minimumTrackTintColor={colors.knob}
            maximumTrackTintColor={colors.border}
            onValueChange={v => setGyroAlpha(v)}
            onSlidingComplete={async v => {
              if (!client) return;
              try {
                await client.setImuFilter(v, gravityTau);
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          />
        </View>
        <View style={styles.sliderItem}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('slider.gravitySmoothing')}</Text>
            <Text style={styles.value}>{gravityTau.toFixed(2)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.01}
            maximumValue={2}
            value={gravityTau}
            step={0.01}
            disabled={disabled}
            minimumTrackTintColor={colors.knob}
            maximumTrackTintColor={colors.border}
            onValueChange={v => setGravityTau(v)}
            onSlidingComplete={async v => {
              if (!client) return;
              try {
                await client.setImuFilter(gyroAlpha, v);
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
