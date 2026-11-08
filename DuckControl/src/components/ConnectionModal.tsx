/** Settings screen: configure robot IP/port, test connection, joystick size.
 *  Full-screen page (not a Modal) for reliable touch handling on real devices. */

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {useRobotStore, JOYSTICK_SIZE_MIN, JOYSTICK_SIZE_MAX} from '../store/robotStore';
import {useTranslation} from '../i18n';
import {createClient, buildBaseUrl, ApiError} from '../api/client';
import {colors} from '../theme/colors';
import {Btn} from './ui';

interface SettingsScreenProps {
  onClose: () => void;
  onConnected?: () => void;
}

export const ConnectionModal: React.FC<SettingsScreenProps> = ({
  onClose,
  onConnected,
}) => {
  const {t} = useTranslation();
  const host = useRobotStore(s => s.host);
  const port = useRobotStore(s => s.port);
  const saveConnection = useRobotStore(s => s.saveConnection);
  const joystickSize = useRobotStore(s => s.joystickSize);
  const setJoystickSize = useRobotStore(s => s.setJoystickSize);

  const [ipValue, setIpValue] = useState(host || '');
  const [portValue, setPortValue] = useState(String(port || 9527));
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ok: boolean; msg: string} | null>(null);

  const testConnection = async () => {
    const ip = ipValue.trim();
    const p = parseInt(portValue, 10) || 9527;
    if (!ip) {
      setTestResult({ok: false, msg: t('conn.enterIp')});
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const tempClient = createClient(buildBaseUrl(ip, p));
      const s = await tempClient.status(5000);
      setTestResult({
        ok: true,
        msg: `${t('conn.connected')}. ${t('conn.mode')}: ${s.mode}, ${t('conn.servos')}: ${s.servo_ids?.length || 0}/15`,
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('conn.failed');
      setTestResult({ok: false, msg});
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    const ip = ipValue.trim();
    const p = parseInt(portValue, 10) || 9527;
    await saveConnection(ip, p);
    onClose();
    if (testResult?.ok) {
      onConnected?.();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backText}>‹ {t('conn.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('conn.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Connection section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('conn.title')}</Text>

          <Text style={styles.label}>{t('conn.ipLabel')}</Text>
          <TextInput
            style={styles.input}
            value={ipValue}
            onChangeText={setIpValue}
            placeholder="192.168.1.100"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
          />

          <Text style={styles.label}>{t('conn.portLabel')}</Text>
          <TextInput
            style={styles.input}
            value={portValue}
            onChangeText={setPortValue}
            placeholder="9527"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />

          {testResult ? (
            <Text
              style={[
                styles.testResult,
                testResult.ok ? styles.testOk : styles.testFail,
              ]}>
              {testResult.msg}
            </Text>
          ) : null}

          <View style={styles.buttonRow}>
            <Btn title={t('conn.test')} onPress={testConnection} disabled={testing} variant="ghost" />
            <Btn title={t('conn.save')} onPress={save} />
          </View>
        </View>

        {/* Joystick size setting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('conn.joystickSize')}</Text>
          <View style={styles.sliderHeader}>
            <Text style={styles.label}>{t('conn.joystickSize')}</Text>
            <Text style={styles.sliderValue}>{joystickSize}px</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={JOYSTICK_SIZE_MIN}
            maximumValue={JOYSTICK_SIZE_MAX}
            step={4}
            value={joystickSize}
            onSlidingComplete={(v: number) => setJoystickSize(v)}
            minimumTrackTintColor={colors.button}
            maximumTrackTintColor={colors.joyBorder}
            thumbTintColor={colors.button}
          />
          <Text style={styles.hint}>{t('conn.joystickSizeHint')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  backText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.joyBorder,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 16,
  },
  testResult: {
    fontSize: 14,
    marginTop: 10,
  },
  testOk: {
    color: colors.accent,
  },
  testFail: {
    color: '#ff6b6b',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.button,
  },
  slider: {
    width: '100%',
    height: 30,
    marginTop: 4,
  },
  hint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
