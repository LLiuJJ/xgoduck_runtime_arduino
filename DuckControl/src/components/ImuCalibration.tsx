/** IMU calibration: calibrate/reset buttons, progress, status text.
 *  Mirrors index.html line 37-48 IMU calibration section. */

import React, {useState} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {useRobotStore} from '../store/robotStore';
import {useTranslation} from '../i18n';
import {colors} from '../theme/colors';
import {Section, Btn, sharedStyles} from './ui';

// Use require for bundled image asset
const calibPose = require('../../assets/imu-calibration-pose.png');

export const ImuCalibration: React.FC = () => {
  const {t} = useTranslation();
  const status = useRobotStore(s => s.status);
  const client = useRobotStore(s => s.client);
  const setMessage = useRobotStore(s => s.setMessage);
  const imuCalibrationActive = useRobotStore(s => s.imuCalibrationActive);
  const controlModeAvailable = useRobotStore(s => s.controlModeAvailable);
  const zeroMotion = useRobotStore(s => s.zeroMotion);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const imuState = status?.imu_calibration || null;
  const imuReady =
    !!status?.imu_ok &&
    status?.feedback_age_ms != null &&
    status.feedback_age_ms < 150;

  const active = imuCalibrationActive;
  const busyOrActive = busy || active;
  const failed = !!errorMsg || imuState?.state === 'error';

  const calibrateDisabled =
    busyOrActive || !imuReady || !controlModeAvailable || !imuState;
  const resetDisabled =
    busyOrActive ||
    !imuReady ||
    !controlModeAvailable ||
    !imuState ||
    (!imuState.calibrated && imuState.state !== 'error');

  const doCalibration = async (action: 'start' | 'reset') => {
    if (!client) return;
    setBusy(true);
    setErrorMsg('');
    zeroMotion();
    try {
      await client.setMode('off');
      await client.imuCalibration(action);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const statusText = failed
    ? t('calib.error')
    : imuState?.message || t('calib.reading');

  return (
    <Section title={t('section.imuCalibration')}>
      <View style={styles.grid}>
        <View style={styles.controls}>
          <View style={sharedStyles.buttonRow}>
            <Btn
              title={
                active
                  ? t('calib.calibrating', {pct: Math.round((imuState?.progress || 0) * 100)})
                  : t('calib.calibrate')
              }
              onPress={() => doCalibration('start')}
              disabled={calibrateDisabled}
            />
            <Btn
              title={t('calib.reset')}
              onPress={() => doCalibration('reset')}
              disabled={resetDisabled}
              variant="ghost"
            />
          </View>
          {active ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${Math.round((imuState?.progress || 0) * 100)}%`},
                ]}
              />
            </View>
          ) : null}
          <Text style={[styles.statusText, failed && styles.errorText]}>
            {statusText}
          </Text>
          <Text style={sharedStyles.hint}>
            {t('calib.hint')}
          </Text>
        </View>
        <Image
          source={calibPose}
          style={styles.poseImage}
          resizeMode="contain"
        />
      </View>
    </Section>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  controls: {
    flex: 1,
    minWidth: 0,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.inputBg,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.knob,
    borderRadius: 3,
  },
  statusText: {
    color: colors.text,
    fontSize: 12,
    marginTop: 6,
  },
  errorText: {
    color: '#ff6b6b',
  },
  poseImage: {
    width: 80,
    height: 102,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.joyBorder,
  },
});
