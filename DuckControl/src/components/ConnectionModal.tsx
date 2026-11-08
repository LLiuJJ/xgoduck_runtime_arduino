/** Connection modal: configure robot IP and port, test connection.
 *  Provides the entry point for the app to connect to the FastAPI server. */

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
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

interface ConnectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  visible,
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t('conn.title')}</Text>

          <Text style={styles.label}>{t('conn.ipLabel')}</Text>
          <TextInput
            style={styles.input}
            value={ipValue}
            onChangeText={setIpValue}
            placeholder="192.168.1.100"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numeric"
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

          {/* Joystick size setting */}
          <View style={styles.joystickSection}>
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

          <View style={styles.buttonRow}>
            <Btn title={t('conn.test')} onPress={testConnection} disabled={testing} variant="ghost" />
            <Btn title={t('conn.save')} onPress={save} />
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t('conn.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
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
    marginTop: 12,
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
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  joystickSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    marginTop: 2,
  },
});
