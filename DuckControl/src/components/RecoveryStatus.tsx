/** Walk and recovery status: current action, tilt angle, recovery timer.
 *  Mirrors index.html line 32-35 section. */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useRobotStore, getRecoveryLabel} from '../store/robotStore';
import {useTranslation} from '../i18n';
import {colors} from '../theme/colors';
import {Section, SmallText} from './ui';

export const RecoveryStatus: React.FC = () => {
  const {t, lang} = useTranslation();
  const status = useRobotStore(s => s.status);
  const {phase, action} = getRecoveryLabel(status, lang);
  const tilt = status?.recovery?.angle_deg;
  const tiltStr = tilt == null ? '—' : tilt.toFixed(1) + '°';

  return (
    <Section title={t('section.walkRecovery')}>
      <View style={styles.row}>
        <View style={styles.card}>
          <SmallText>{t('recovery.currentAction')}</SmallText>
          <Text style={styles.value}>{phase}</Text>
        </View>
        <View style={styles.card}>
          <SmallText>{t('recovery.tilt')}</SmallText>
          <Text style={styles.value}>{tiltStr}</Text>
        </View>
        <View style={styles.card}>
          <SmallText>{t('recovery.status')}</SmallText>
          <Text style={styles.value}>{action}</Text>
        </View>
      </View>
    </Section>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: 60,
  },
  value: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
});
