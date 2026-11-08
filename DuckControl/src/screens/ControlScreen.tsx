/** Main control screen: landscape game-controller layout with tabs.
 *  Top bar merges header + tabs into one row.
 *  Mode controls are in a right-side drawer.
 *  Control tab: dual joysticks + action buttons (fits one screen). */

import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useRobotStore, MOTION_RANGES, DEADZONE, getModeLabel} from '../store/robotStore';
import {useTranslation, useI18n} from '../i18n';
import {useStatusPolling} from '../hooks/useStatusPolling';
import {useCommandLoop} from '../hooks/useCommandLoop';
import {useAppState, useForeground} from '../hooks/useAppState';
import {colors} from '../theme/colors';
import {Joystick} from '../components/Joystick';
import {MetricsBar} from '../components/MetricsBar';
import {ModeButtons} from '../components/ModeButtons';
import {ActionButtons} from '../components/ActionButtons';
import {HeadMouthControls} from '../components/HeadMouthControls';
import {ActionSettings} from '../components/ActionSettings';
import {ImuFilters} from '../components/ImuFilters';
import {RecoveryStatus} from '../components/RecoveryStatus';
import {Telemetry} from '../components/Telemetry';
import {ImuCalibration} from '../components/ImuCalibration';
import {ConnectionModal} from '../components/ConnectionModal';
import {Btn, sharedStyles} from '../components/ui';

interface StickState {
  x: number;
  y: number;
}

type TabKey = 'control' | 'tuning' | 'info';

const deadzone = (v: number): number =>
  Math.abs(v) <= DEADZONE ? 0 : v;

const SCREEN_W = Dimensions.get('window').width;

export const ControlScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const fg = useForeground();

  const {t, lang} = useTranslation();

  const host = useRobotStore(s => s.host);
  const client = useRobotStore(s => s.client);
  const connected = useRobotStore(s => s.connected);
  const message = useRobotStore(s => s.message);
  const status = useRobotStore(s => s.status);
  const rollerEnabled = useRobotStore(s => s.rollerEnabled);
  const imuCalibrationActive = useRobotStore(s => s.imuCalibrationActive);
  const controlModeAvailable = useRobotStore(s => s.controlModeAvailable);
  const kickActive = useRobotStore(s => s.kickActive);
  const setTargetMotion = useRobotStore(s => s.setTargetMotion);
  const zeroMotion = useRobotStore(s => s.zeroMotion);
  const setMessage = useRobotStore(s => s.setMessage);
  const motion = useRobotStore(s => s.motion);

  const [activeTab, setActiveTab] = useState<TabKey>('control');
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sticksRef = useRef<{left: StickState; right: StickState}>({
    left: {x: 0, y: 0},
    right: {x: 0, y: 0},
  });

  useEffect(() => {
    if (!host) {
      setModalVisible(true);
    }
  }, [host]);

  const pollingEnabled = fg && !!client;
  useStatusPolling(pollingEnabled);
  useCommandLoop(fg && connected && controlModeAvailable);
  useAppState(fg);

  const limits = MOTION_RANGES[rollerEnabled ? 'roller' : 'walk'];

  const updateMotion = useCallback(() => {
    if (kickActive || imuCalibrationActive) {
      setTargetMotion([0, 0, 0]);
      return;
    }
    const sticks = sticksRef.current;
    const forward = deadzone(sticks.left.y);
    const strafe = deadzone(-sticks.left.x) * limits.strafe;
    const yaw = deadzone(-sticks.right.x) * limits.yaw;
    let vx = forward * (forward < 0 ? limits.backward : limits.forward);
    const vy = strafe;
    let wz = yaw;
    vx = Math.max(-limits.backward, Math.min(limits.forward, vx));
    wz = Math.max(-limits.yaw, Math.min(limits.yaw, wz));
    setTargetMotion([vx, vy, wz]);
  }, [kickActive, imuCalibrationActive, limits, setTargetMotion]);

  const onLeftJoystickMove = useCallback(
    (x: number, y: number) => {
      sticksRef.current.left = {x, y};
      updateMotion();
    },
    [updateMotion],
  );

  const onLeftJoystickRelease = useCallback(() => {
    sticksRef.current.left = {x: 0, y: 0};
    updateMotion();
  }, [updateMotion]);

  const onRightJoystickMove = useCallback(
    (x: number, y: number) => {
      sticksRef.current.right = {x, y};
      updateMotion();
    },
    [updateMotion],
  );

  const onRightJoystickRelease = useCallback(() => {
    sticksRef.current.right = {x: 0, y: 0};
    updateMotion();
  }, [updateMotion]);

  const torqueOff = async () => {
    if (!client) return;
    zeroMotion();
    try {
      await client.setMode('off');
      setMessage(t('misc.torqueOff'));
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  const leftLabel = rollerEnabled ? t('ctrl.fwdBwd') : t('ctrl.fwdStrafe');
  const leftValue = `vx ${motion[0].toFixed(2)} · vy ${motion[1].toFixed(2)}`;
  const rightValue = `wz ${motion[2].toFixed(2)}`;
  const joystickDisabled = kickActive || imuCalibrationActive || !controlModeAvailable;

  const tabs: {key: TabKey; label: string}[] = [
    {key: 'control', label: t('tab.control')},
    {key: 'tuning', label: t('tab.tuning')},
    {key: 'info', label: t('tab.info')},
  ];

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* === Compact top bar: header + tabs + message in one row === */}
      <View style={styles.topBar}>
        {/* Left: status + mode label */}
        <View style={styles.topLeft}>
          <View style={[styles.statusDot, connected ? styles.dotOn : styles.dotOff]} />
          <Text style={styles.modeText}>{getModeLabel(status, lang)}</Text>
        </View>

        {/* Center: metrics */}
        <MetricsBar />

        {/* Right: tabs + action buttons */}
        <View style={styles.topRight}>
          <View style={styles.tabGroup}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}>
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'control' && (
            <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.drawerBtn}>
              <Text style={styles.drawerBtnText}>☰ {t('top.mode')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => useI18n.getState().toggleLang()} style={styles.langBtn}>
            <Text style={styles.langBtnText}>{lang === 'en' ? '中' : 'EN'}</Text>
          </TouchableOpacity>

          <Btn title="⚡" onPress={torqueOff} danger disabled={!client} style={styles.iconBtn} />
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.gearBtn}>
            <Text style={styles.gearIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Message — tiny inline */}
      {message ? (
        <Text style={styles.msgText} numberOfLines={1}>{message}</Text>
      ) : null}

      {/* === Tab content === */}
      {activeTab === 'control' && (
        <View style={styles.controlTab}>
          {/* Left: joystick */}
          <View style={styles.joystickCol}>
            <Joystick
              size={116}
              label={leftLabel}
              valueLabel={leftValue}
              disabled={joystickDisabled}
              onMove={onLeftJoystickMove}
              onRelease={onLeftJoystickRelease}
            />
          </View>

          {/* Center: action buttons in a vertical cluster */}
          <View style={styles.actionCol}>
            <ActionButtons bare />
            <Btn
              title={t('top.zeroMotion')}
              onPress={() => {
                sticksRef.current = {left: {x: 0, y: 0}, right: {x: 0, y: 0}};
                zeroMotion();
              }}
              disabled={joystickDisabled}
              variant="ghost"
              style={styles.zeroBtn}
            />
          </View>

          {/* Right: joystick */}
          <View style={styles.joystickCol}>
            <Joystick
              size={116}
              label={t('ctrl.yaw')}
              valueLabel={rightValue}
              disabled={joystickDisabled}
              onMove={onRightJoystickMove}
              onRelease={onRightJoystickRelease}
            />
          </View>
        </View>
      )}

      {activeTab === 'tuning' && (
        <View style={styles.tuningTab}>
          <View style={styles.tuningCol}>
            <HeadMouthControls />
          </View>
          <View style={styles.tuningCol}>
            <ActionSettings />
          </View>
          <View style={styles.tuningCol}>
            <ImuFilters />
          </View>
        </View>
      )}

      {activeTab === 'info' && (
        <View style={styles.infoTab}>
          <View style={styles.colItem}>
            <RecoveryStatus />
          </View>
          <View style={styles.colItemFlex2}>
            <Telemetry />
          </View>
          <View style={styles.colItem}>
            <ImuCalibration />
          </View>
        </View>
      )}

      {/* === Mode Drawer (right side panel) === */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDrawerOpen(false)}>
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setDrawerOpen(false)}>
          <View style={styles.drawerPanel} onStartShouldSetResponder={() => true}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{t('top.mode')}</Text>
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <Text style={styles.drawerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ModeButtons bare />
          </View>
        </TouchableOpacity>
      </Modal>

      <ConnectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  /* === Top bar === */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: '#34c759',
  },
  dotOff: {
    backgroundColor: colors.danger,
  },
  modeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  /* === Tabs === */
  tabGroup: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: colors.card,
    borderRadius: 6,
    padding: 2,
  },
  tab: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  /* === Buttons === */
  drawerBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  drawerBtnText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 32,
  },
  gearBtn: {
    padding: 4,
  },
  gearIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  /* === Message === */
  msgText: {
    color: colors.warning,
    fontSize: 11,
    paddingHorizontal: 12,
    paddingBottom: 2,
    minHeight: 14,
  },
  /* === Control tab === */
  controlTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  joystickCol: {
    alignItems: 'center',
  },
  actionCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  zeroBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  /* === Tune tab: 3 columns, no scroll === */
  tuningTab: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tuningCol: {
    flex: 1,
  },
  /* === Info tab: 3 columns, no scroll === */
  infoTab: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  colItem: {
    flex: 1,
  },
  colItemFlex2: {
    flex: 2,
  },
  /* === Drawer === */
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  drawerPanel: {
    backgroundColor: colors.background,
    width: Math.min(280, SCREEN_W * 0.35),
    height: '100%',
    padding: 16,
    paddingTop: 40,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: -2, height: 0},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  drawerClose: {
    fontSize: 18,
    color: colors.textSecondary,
    padding: 4,
  },
  langBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  langBtnText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
});
