/** Telemetry: IMU data and joint table.
 *  Mirrors index.html line 36 telemetry section. */

import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useRobotStore, MOTOR_IDS} from '../store/robotStore';
import {useTranslation} from '../i18n';
import {colors} from '../theme/colors';
import {Section} from './ui';

const formatVec = (v: number[] | null | undefined): string => {
  if (!v) return '—';
  return v.map(x => x.toFixed(3)).join(' / ');
};

export const Telemetry: React.FC = () => {
  const {t} = useTranslation();
  const status = useRobotStore(s => s.status);

  const acc = status?.acc_corrected || status?.acc || null;
  const gyro = status?.gyro_corrected || status?.gyro || null;
  const gravity = status?.gravity || null;
  const accRaw = status?.acc || null;
  const gyroRaw = status?.gyro || null;
  const angles = status?.angles;
  const targets = status?.targets;
  const motors = status?.motors || MOTOR_IDS;
  const servoIds = status?.servo_ids || [];

  const imuLines: [string, number[] | null][] = [
    ['acc', acc],
    ['gyro', gyro],
    ['grav', gravity],
    ['acc raw', accRaw],
    ['gyro raw', gyroRaw],
  ];

  return (
    <Section title={t('section.imuServos')}>
      <View style={styles.grid}>
        {/* IMU lines */}
        <View style={styles.imuLines}>
          {imuLines.map(([label, vals]) => (
            <View key={label} style={styles.imuLine}>
              <Text style={styles.imuLabel}>{label}</Text>
              <Text style={styles.imuValue}>{formatVec(vals)}</Text>
            </View>
          ))}
        </View>

        {/* Joint table */}
        <ScrollView style={styles.tableScroll} nestedScrollEnabled>
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.headerCell, styles.cellId]}>ID</Text>
              <Text style={[styles.cell, styles.headerCell]}>°</Text>
              <Text style={[styles.cell, styles.headerCell]}>Target</Text>
            </View>
            {motors.map((id, i) => {
              const online = servoIds.includes(id);
              return (
                <View
                  key={id}
                  style={[styles.row, !online && styles.missingRow]}>
                  <Text style={[styles.cell, styles.cellId]}>{id}</Text>
                  <Text style={styles.cell}>
                    {angles ? angles[i].toFixed(1) : '—'}
                  </Text>
                  <Text style={styles.cell}>
                    {targets ? targets[i].toFixed(1) : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <Text style={styles.healthText}>
        {status?.control_ready ? t('telemetry.controlsReady') : t('telemetry.waitingFeedback')}
      </Text>
    </Section>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  imuLines: {
    flex: 1,
    minWidth: 120,
  },
  imuLine: {
    flexDirection: 'row',
    paddingVertical: 1,
  },
  imuLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    minWidth: 50,
  },
  imuValue: {
    color: colors.accent,
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
  },
  tableScroll: {
    flex: 1.4,
    maxHeight: 140,
  },
  table: {
    borderWidth: 0,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {},
  headerCell: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cell: {
    flex: 1,
    fontSize: 11,
    color: colors.text,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  cellId: {
    flex: 0.5,
  },
  missingRow: {
    opacity: 0.55,
  },
  healthText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});
