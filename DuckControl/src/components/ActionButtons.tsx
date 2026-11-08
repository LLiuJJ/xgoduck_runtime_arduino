/** Action buttons: Pick, Roulade, Sit/Stand, Left kick, Right kick.
 *  Supports `bare` mode for compact inline layout (no Section wrapper). */

import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {useRobotStore} from '../store/robotStore';
import {useTranslation} from '../i18n';
import {Section, Btn, sharedStyles} from './ui';

export const ActionButtons: React.FC<{bare?: boolean}> = ({bare}) => {
  const {t} = useTranslation();
  const status = useRobotStore(s => s.status);
  const client = useRobotStore(s => s.client);
  const setMessage = useRobotStore(s => s.setMessage);
  const actionPreparing = useRobotStore(s => s.actionPreparing);
  const kickActive = useRobotStore(s => s.kickActive);
  const sitstandPhase = useRobotStore(s => s.sitstandPhase);
  const sitstandReady = useRobotStore(s => s.sitstandReady);
  const zeroMotion = useRobotStore(s => s.zeroMotion);
  const imuCalibrationActive = useRobotStore(s => s.imuCalibrationActive);

  const [pickBusy, setPickBusy] = useState(false);
  const [rouladeBusy, setRouladeBusy] = useState(false);
  const [sitstandBusy, setSitstandBusy] = useState(false);
  const [kickBusy, setKickBusy] = useState(false);

  const controlReady = status?.control_ready ?? false;
  const sitActive = !!status?.sitstand?.active;
  const kickRunning = !!status?.left_kick?.active || !!status?.right_kick?.active;
  const upright =
    status?.mode === 'shadow' ||
    (status?.mode === 'policy' && status?.recovery?.active && status?.recovery?.phase === 'walk');
  const pickDisabled =
    actionPreparing || sitActive || kickRunning || !upright ||
    !!status?.pick?.active || !!status?.roulade?.active || imuCalibrationActive;

  const doAction = async (
    fn: () => Promise<unknown>,
    busySetter: (v: boolean) => void,
    label: string,
  ) => {
    if (!client) return;
    busySetter(true);
    try {
      await fn();
      setMessage(label);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      busySetter(false);
    }
  };

  const sitstandLabel = sitstandPhase === 'idle' ? t('action.sit') : t('action.stand');
  const sitstandDisabled =
    sitstandBusy || sitstandPhase === 'stand' || !sitstandReady || kickActive || actionPreparing || imuCalibrationActive;

  const content = (
    <View style={[sharedStyles.buttonRow, bare && styles.bareRow]}>
      <Btn
        title={t('action.pick')}
        onPress={() => doAction(() => client!.pick(), setPickBusy, t('action.pick'))}
        disabled={pickDisabled || pickBusy}
        variant="ghost"
      />
      <Btn
        title={t('action.roulade')}
        onPress={() => doAction(() => client!.roulade(), setRouladeBusy, t('action.roulade'))}
        disabled={pickDisabled || rouladeBusy}
        variant="ghost"
      />
      <Btn
        title={sitstandLabel}
        onPress={() => {
          const action = sitstandPhase === 'sit' ? 'stand' : 'sit';
          zeroMotion();
          doAction(() => client!.sitstand(action), setSitstandBusy, action === 'sit' ? t('action.sitting') : t('action.standingUp'));
        }}
        disabled={sitstandDisabled}
        variant="ghost"
      />
      <Btn
        title={t('action.lKick')}
        onPress={() => {
          zeroMotion();
          doAction(() => client!.leftKick(), setKickBusy, t('action.leftKick'));
        }}
        disabled={kickBusy || kickActive || actionPreparing || !controlReady || pickDisabled || imuCalibrationActive}
        variant="ghost"
      />
      <Btn
        title={t('action.rKick')}
        onPress={() => {
          zeroMotion();
          doAction(() => client!.rightKick(), setKickBusy, t('action.rightKick'));
        }}
        disabled={kickBusy || kickActive || actionPreparing || !controlReady || pickDisabled || imuCalibrationActive}
        variant="ghost"
      />
    </View>
  );

  if (bare) {
    return content;
  }

  return <Section title={t('section.actions')}>{content}</Section>;
};

const styles = StyleSheet.create({
  bareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
});
