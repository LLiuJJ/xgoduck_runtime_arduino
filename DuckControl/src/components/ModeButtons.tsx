/** Mode selection buttons: Inference only, Default pose, Walk/get up,
 *  Skating toggle, Heading hold toggle.
 *  Supports `bare` mode for drawer usage (no Section wrapper). */

import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useRobotStore} from '../store/robotStore';
import {useTranslation} from '../i18n';
import {colors} from '../theme/colors';
import {Section, Btn, sharedStyles} from './ui';

export const ModeButtons: React.FC<{bare?: boolean}> = ({bare}) => {
  const {t} = useTranslation();
  const status = useRobotStore(s => s.status);
  const client = useRobotStore(s => s.client);
  const setMessage = useRobotStore(s => s.setMessage);
  const rollerEnabled = useRobotStore(s => s.rollerEnabled);
  const headingHoldEnabled = useRobotStore(s => s.headingHoldEnabled);
  const imuCalibrationActive = useRobotStore(s => s.imuCalibrationActive);
  const controlModeAvailable = useRobotStore(s => s.controlModeAvailable);
  const actionPreparing = useRobotStore(s => s.actionPreparing);
  const kickActive = useRobotStore(s => s.kickActive);
  const sitstandPhase = useRobotStore(s => s.sitstandPhase);

  const [modeBusy, setModeBusy] = useState(false);
  const [rollerBusy, setRollerBusy] = useState(false);
  const [headingBusy, setHeadingBusy] = useState(false);

  const controlReady = status?.control_ready ?? false;
  const sitActive = !!status?.sitstand?.active;
  const kickRunning = !!status?.left_kick?.active || !!status?.right_kick?.active;

  const setMode = async (mode: string) => {
    if (!client) return;
    setModeBusy(true);
    try {
      await client.setMode(mode as never);
      setMessage(t('mode.updated'));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setModeBusy(false);
    }
  };

  const toggleRoller = async () => {
    if (!client || rollerBusy) return;
    const enabled = !rollerEnabled;
    setRollerBusy(true);
    try {
      const r = await client.setRoller(enabled);
      setMessage(`${t('mode.skating')} ${r.enabled ? t('mode.on') : t('mode.off')}`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setRollerBusy(false);
    }
  };

  const toggleHeading = async () => {
    if (!client || headingBusy) return;
    const enabled = !headingHoldEnabled;
    setHeadingBusy(true);
    try {
      await client.setHeadingHold(enabled);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setHeadingBusy(false);
    }
  };

  const modeDisabled =
    modeBusy || imuCalibrationActive || !controlModeAvailable;
  const policyDisabled =
    modeDisabled || !controlReady || sitActive || kickRunning;

  const buttons = (
    <>
      <View style={[sharedStyles.buttonRow, bare && styles.bareRow]}>
        <Btn
          title={t('mode.inferenceOnly')}
          onPress={() => setMode('shadow')}
          disabled={modeDisabled}
          variant={status?.mode === 'shadow' ? 'primary' : 'ghost'}
        />
        <Btn
          title={t('mode.defaultPose')}
          onPress={() => setMode('hold')}
          disabled={modeDisabled || !controlReady}
          variant={status?.mode === 'hold' ? 'primary' : 'ghost'}
        />
        <Btn
          title={t('mode.walkGetUp')}
          onPress={() => setMode('policy')}
          disabled={policyDisabled}
          variant={status?.mode === 'policy' ? 'primary' : 'ghost'}
        />
        <Btn
          title={`${t('mode.skating')} ${rollerEnabled ? t('mode.on') : t('mode.off')}`}
          onPress={toggleRoller}
          disabled={rollerBusy || sitActive || kickRunning || actionPreparing || imuCalibrationActive}
          variant={rollerEnabled ? 'primary' : 'ghost'}
        />
        <TouchableOpacity
          style={sharedStyles.toggleContainer}
          onPress={toggleHeading}
          disabled={headingBusy || imuCalibrationActive}>
          <View style={[styles.checkbox, headingHoldEnabled && styles.checkboxOn]} />
          <Text style={sharedStyles.toggleText}>
            {t('mode.headingHold')} {headingHoldEnabled ? t('mode.on') : t('mode.off')}
          </Text>
        </TouchableOpacity>
      </View>
      {!bare && (
        <Text style={sharedStyles.hint}>
          {t('mode.hint')}
        </Text>
      )}
    </>
  );

  if (bare) {
    return <View>{buttons}</View>;
  }

  return <Section title={t('section.mode')}>{buttons}</Section>;
};

const styles = StyleSheet.create({
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.joyBorder,
    borderRadius: 4,
  },
  checkboxOn: {
    backgroundColor: colors.knob,
    borderColor: colors.knob,
  },
  bareRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
});
