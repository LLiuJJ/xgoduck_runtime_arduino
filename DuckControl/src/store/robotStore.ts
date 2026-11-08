/** Zustand store: connection config, robot status, motion state, action flags.
 *  Centralized state mirroring assets/app.js DOM-based state. */

import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient, buildBaseUrl, type ApiClient} from '../api/client';
import {useI18n, type Lang} from '../i18n';
import type {
  RobotStatus,
  Vec3,
  Vec4,
  MotionLimits,
  RobotMode,
} from '../types/robot';

const STORAGE_KEY_HOST = '@duck_host';
const STORAGE_KEY_PORT = '@duck_port';
const DEFAULT_PORT = 9527;

export const MOTION_RANGES: Record<'walk' | 'roller', MotionLimits> = {
  walk: {forward: 0.2, backward: 0.2, strafe: 0.3, yaw: 1},
  roller: {forward: 0.4, backward: 0.4, strafe: 0, yaw: 0.45},
};

export const DEADZONE = 0.15;
export const MOTOR_IDS = [10, 11, 12, 13, 14, 20, 21, 22, 23, 24, 30, 31, 32, 33, 34];

interface RobotStore {
  // Connection
  host: string;
  port: number;
  connected: boolean;
  client: ApiClient | null;
  loadConnection: () => Promise<void>;
  saveConnection: (host: string, port: number) => Promise<void>;
  setConnection: (host: string, port: number) => void;

  // Status
  status: RobotStatus | null;
  setStatus: (s: RobotStatus | null) => void;
  setConnected: (v: boolean) => void;
  message: string;
  setMessage: (m: string) => void;

  // Motion
  targetMotion: Vec3;
  motion: Vec3;
  setTargetMotion: (m: Vec3) => void;
  zeroMotion: () => void;
  smoothMotion: () => Vec3;

  // Head & mouth
  head: Vec4;
  mouth: number;
  setHead: (index: number, value: number) => void;
  setMouth: (value: number) => void;

  // Derived flags (updated from status)
  rollerEnabled: boolean;
  headingHoldEnabled: boolean;
  imuCalibrationActive: boolean;
  controlModeAvailable: boolean;
  actionPreparing: boolean;
  kickActive: boolean;
  sitstandPhase: string;
  sitstandReady: boolean;
}

function makeClient(host: string, port: number): ApiClient {
  return createClient(buildBaseUrl(host, port));
}

export const useRobotStore = create<RobotStore>((set, get) => ({
  // Connection
  host: '',
  port: DEFAULT_PORT,
  connected: false,
  client: null,

  loadConnection: async () => {
    try {
      const [host, portStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_HOST),
        AsyncStorage.getItem(STORAGE_KEY_PORT),
      ]);
      const hostVal = host || '';
      const portVal = portStr ? parseInt(portStr, 10) : DEFAULT_PORT;
      const client = hostVal ? makeClient(hostVal, portVal) : null;
      set({host: hostVal, port: portVal, client});
    } catch {
      set({host: '', port: DEFAULT_PORT, client: null});
    }
  },

  saveConnection: async (host, port) => {
    await AsyncStorage.setItem(STORAGE_KEY_HOST, host);
    await AsyncStorage.setItem(STORAGE_KEY_PORT, String(port));
    const client = host ? makeClient(host, port) : null;
    set({host, port, client, connected: false, status: null});
  },

  setConnection: (host, port) => {
    const client = host ? makeClient(host, port) : null;
    set({host, port, client, connected: false, status: null});
  },

  // Status
  status: null,
  setStatus: s => {
    if (!s) {
      set({status: null});
      return;
    }
    const rollerEnabled = s.roller?.enabled ?? false;
    const imuCalibrationActive = !!s.imu_calibration?.active;
    const controlModeAvailable = !['calibrate', 'servo_debug'].includes(s.mode);
    const actionPreparing = !!s.action_preparation?.active;
    const kick = s.left_kick?.active ? s.left_kick : s.right_kick;
    const kickActive = !!kick?.active;
    const sitstand = s.sitstand;
    const sitstandPhase = sitstand?.phase || 'idle';
    const recovery = s.recovery;
    const sitstandReady =
      !!sitstand &&
      !!s.control_ready &&
      recovery?.phase === 'walk' &&
      !s.pick?.active &&
      !s.roulade?.active &&
      !kickActive &&
      !actionPreparing;
    const headingHoldEnabled = s.heading_hold?.enabled ?? false;

    set({
      status: s,
      rollerEnabled,
      imuCalibrationActive,
      controlModeAvailable,
      actionPreparing,
      kickActive,
      sitstandPhase,
      sitstandReady,
      headingHoldEnabled,
      // If IMU calibration is active, force zero motion
      targetMotion: imuCalibrationActive ? [0, 0, 0] : get().targetMotion,
    });
  },

  setConnected: v => set({connected: v}),
  message: 'Connecting…',
  setMessage: m => set({message: m}),

  // Motion
  targetMotion: [0, 0, 0],
  motion: [0, 0, 0],
  setTargetMotion: m => set({targetMotion: m}),
  zeroMotion: () => set({targetMotion: [0, 0, 0], motion: [0, 0, 0]}),
  smoothMotion: () => {
    const {targetMotion, motion, imuCalibrationActive} = get();
    if (imuCalibrationActive) {
      set({motion: [0, 0, 0], targetMotion: [0, 0, 0]});
      return [0, 0, 0] as Vec3;
    }
    const smoothed = motion.map((old, i) => {
      const value = 0.75 * old + 0.25 * targetMotion[i];
      return targetMotion[i] === 0 && Math.abs(value) < 0.001 ? 0 : value;
    }) as Vec3;
    set({motion: smoothed});
    return smoothed;
  },

  // Head & mouth
  head: [0, 0, 0, 0],
  mouth: 0,
  setHead: (index, value) => {
    const head = [...get().head] as Vec4;
    head[index] = value;
    set({head});
  },
  setMouth: value => set({mouth: value}),

  // Derived
  rollerEnabled: false,
  headingHoldEnabled: true,
  imuCalibrationActive: false,
  controlModeAvailable: true,
  actionPreparing: false,
  kickActive: false,
  sitstandPhase: 'idle',
  sitstandReady: false,
}));

/** Get the mode label for display, mirroring app.js modeLabel map.
 *  Pass current i18n lang for localization. */
export function getModeLabel(status: RobotStatus | null, lang: Lang = 'en'): string {
  const t = useI18n.getState().t;
  // t already respects current lang, but we keep lang param for re-render triggering
  void lang;
  if (!status) return '—';
  const modeKey: Record<string, string> = {
    shadow: 'modeLabel.shadow',
    off: 'modeLabel.off',
    hold: 'modeLabel.hold',
    policy: 'modeLabel.policy',
    calibrate: 'modeLabel.calibrate',
    servo_debug: 'modeLabel.servoDebug',
  };
  let label: string;
  if (status.left_kick?.active) label = t('modeLabel.leftKick');
  else if (status.right_kick?.active) label = t('modeLabel.rightKick');
  else if (status.sitstand?.active) label = t(status.sitstand.phase === 'sit' ? 'modeLabel.sit' : 'modeLabel.stand');
  else label = modeKey[status.mode] ? t(modeKey[status.mode]) : status.mode;
  return label + (status.enabled ? ' · ' + t('modeLabel.enabled') : ' · ' + t('modeLabel.torqueOff'));
}

/** Get the recovery phase label, mirroring app.js phaseLabel logic.
 *  Pass current i18n lang for localization. */
export function getRecoveryLabel(status: RobotStatus | null, lang: Lang = 'en'): {
  phase: string;
  action: string;
} {
  const t = useI18n.getState().t;
  void lang;
  if (!status || !status.recovery?.active) {
    return {phase: t('recLabel.idle'), action: '—'};
  }
  const r = status.recovery;
  const preparing = status.action_preparation?.active;
  const kickRunning = !!status.left_kick?.active || !!status.right_kick?.active;
  const sitActive = !!status.sitstand?.active;
  const preparingKey: Record<string, string> = {
    pick: 'action.pick',
    roulade: 'action.roulade',
    sit: 'action.sit',
    stand: 'action.stand',
    left_kick: 'action.leftKick',
    right_kick: 'action.rightKick',
  };
  const prepAction = status.action_preparation?.action;

  let phaseLabel: string;
  if (preparing) {
    phaseLabel = t('recLabel.preparing') + ' ' + (preparingKey[prepAction || ''] ? t(preparingKey[prepAction || '']) : '');
  } else if (kickRunning) {
    const kick = status.left_kick?.active ? status.left_kick : status.right_kick;
    phaseLabel = kick?.side === 'left' ? t('action.leftKick') : t('action.rightKick');
  } else if (sitActive) {
    phaseLabel = status.sitstand?.phase === 'sit' ? t('recLabel.sitting') : t('recLabel.standingUp');
  } else if (status.roulade?.active) {
    phaseLabel = t('recLabel.roulade');
  } else if (status.pick?.active) {
    phaseLabel = t('recLabel.pick');
  } else {
    const phaseKey: Record<string, string> = {
      walk: 'recLabel.walking',
      default_pose: 'recLabel.preparingGetUp',
      getup: 'recLabel.gettingUp',
    };
    phaseLabel = phaseKey[r.phase] ? t(phaseKey[r.phase]) : r.phase;
  }

  let timerLabel: string;
  if (!r.active) timerLabel = t('recLabel.stopped');
  else if (
    r.phase === 'walk' &&
    !preparing &&
    !kickRunning &&
    !sitActive &&
    !status.roulade?.active &&
    !status.pick?.active
  )
    timerLabel = t('recLabel.ready');
  else timerLabel = phaseLabel;

  return {phase: phaseLabel, action: timerLabel};
}

export type {RobotMode};
