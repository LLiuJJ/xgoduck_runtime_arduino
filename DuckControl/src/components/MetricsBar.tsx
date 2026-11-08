/** Metrics bar: Feedback Hz, Policy Hz, Servos online, Voltage, IMU.
 *  Compact inline layout for landscape header. */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useRobotStore} from '../store/robotStore';
import {colors} from '../theme/colors';

export const MetricsBar: React.FC = () => {
  const status = useRobotStore(s => s.status);

  const rxHz = status ? status.feedback_hz.toFixed(1) : '—';
  const rlHz = status ? status.inference_hz.toFixed(1) : '—';
  const servos = status ? `${status.servo_ids?.length || 0}/15` : '—';
  const voltage = status?.voltage_v == null ? '—' : status.voltage_v.toFixed(1);
  const imu = status ? (status.imu_ok ? 'OK' : 'ERR') : '—';

  const items: [string, string][] = [
    ['Hz', rxHz],
    ['AI', rlHz],
    ['SV', servos],
    ['V', voltage],
    ['IMU', imu],
  ];

  return (
    <View style={styles.row}>
      {items.map(([label, value]) => (
        <View key={label} style={styles.item}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  item: {
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 9,
  },
  value: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
});
