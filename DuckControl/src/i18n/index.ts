/** Lightweight i18n: Zustand store with AsyncStorage persistence.
 *  Supports English (en) and Chinese (zh). */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'en' | 'zh';

type TFunc = (key: string, params?: Record<string, string | number>) => string;

const en: Record<string, string> = {
  // Tabs
  'tab.control': 'Ctrl',
  'tab.tuning': 'Tune',
  'tab.info': 'Info',

  // Top bar / drawer
  'top.mode': 'Mode',
  'top.zeroMotion': 'Zero motion',

  // Control labels
  'ctrl.fwdStrafe': 'Fwd / strafe',
  'ctrl.fwdBwd': 'Fwd / bwd',
  'ctrl.yaw': 'Yaw',

  // Mode buttons
  'mode.inferenceOnly': 'Inference only',
  'mode.defaultPose': 'Default pose',
  'mode.walkGetUp': 'Walk / get up',
  'mode.skating': 'Skating',
  'mode.headingHold': 'Heading hold',
  'mode.on': 'On',
  'mode.off': 'Off',
  'mode.updated': 'Mode updated',
  'mode.hint': 'Hold: standing pose. Walk: walk & auto-recover.',

  // Action buttons
  'action.pick': 'Pick',
  'action.roulade': 'Roulade',
  'action.sit': 'Sit',
  'action.stand': 'Stand',
  'action.lKick': 'L Kick',
  'action.rKick': 'R Kick',
  'action.sitting': 'Sitting',
  'action.standingUp': 'Standing up',
  'action.leftKick': 'Left kick',
  'action.rightKick': 'Right kick',

  // Section titles
  'section.mode': 'Mode',
  'section.actions': 'Actions',
  'section.headMouth': 'Head and mouth',
  'section.actionSettings': 'Action settings',
  'section.imuFiltering': 'IMU filtering',
  'section.walkRecovery': 'Walk and recovery',
  'section.imuServos': 'IMU and servos',
  'section.imuCalibration': 'IMU calibration',

  // Sliders
  'slider.actionScale': 'Action scale',
  'slider.legSmoothing': 'Leg smoothing',
  'slider.headSmoothing': 'Head smoothing',
  'slider.gyroSmoothing': 'Gyro smoothing',
  'slider.gravitySmoothing': 'Gravity smoothing',
  'slider.mouth': 'Mouth',

  // Recovery
  'recovery.currentAction': 'Current action',
  'recovery.tilt': 'Tilt',
  'recovery.status': 'Status',

  // Telemetry
  'telemetry.controlsReady': 'Controls ready.',
  'telemetry.waitingFeedback': 'Waiting for feedback.',

  // IMU Calibration
  'calib.calibrate': 'Calibrate IMU',
  'calib.reset': 'Reset IMU calibration',
  'calib.calibrating': 'Calibrating… {pct}%',
  'calib.error': 'Error: Slight movement. Please recalibrate.',
  'calib.reading': 'Reading calibration status…',
  'calib.hint': 'Keep Arduino upright, bottom edge on tabletop. Hold still 1.5s.',

  // Connection modal
  'conn.title': 'Robot Connection',
  'conn.ipLabel': 'Robot IP address',
  'conn.portLabel': 'Port',
  'conn.test': 'Test connection',
  'conn.save': 'Save',
  'conn.cancel': 'Cancel',
  'conn.enterIp': 'Please enter a robot IP address.',
  'conn.connected': 'Connected',
  'conn.failed': 'Connection failed',
  'conn.mode': 'Mode',
  'conn.servos': 'servos',

  // Mode labels (getModeLabel)
  'modeLabel.shadow': 'inference only',
  'modeLabel.off': 'torque off',
  'modeLabel.hold': 'default pose',
  'modeLabel.policy': 'walk',
  'modeLabel.calibrate': 'calibration',
  'modeLabel.servoDebug': 'servo setup',
  'modeLabel.leftKick': 'left kick',
  'modeLabel.rightKick': 'right kick',
  'modeLabel.sit': 'sit',
  'modeLabel.stand': 'stand',
  'modeLabel.enabled': 'enabled',
  'modeLabel.torqueOff': 'torque off',

  // Recovery labels (getRecoveryLabel)
  'recLabel.idle': 'idle',
  'recLabel.stopped': 'Stopped',
  'recLabel.ready': 'Ready',
  'recLabel.walking': 'Walking',
  'recLabel.preparingGetUp': 'Preparing to get up',
  'recLabel.gettingUp': 'Getting up',
  'recLabel.preparing': 'Preparing',
  'recLabel.sitting': 'Sitting',
  'recLabel.standingUp': 'Standing up',
  'recLabel.roulade': 'Roulade',
  'recLabel.pick': 'Pick',

  // Misc
  'misc.torqueOff': 'Torque off',
};

const zh: Record<string, string> = {
  // Tabs
  'tab.control': '控制',
  'tab.tuning': '调试',
  'tab.info': '信息',

  // Top bar / drawer
  'top.mode': '模式',
  'top.zeroMotion': '归零',

  // Control labels
  'ctrl.fwdStrafe': '前进/侧移',
  'ctrl.fwdBwd': '前进/后退',
  'ctrl.yaw': '转向',

  // Mode buttons
  'mode.inferenceOnly': '仅推理',
  'mode.defaultPose': '默认姿态',
  'mode.walkGetUp': '行走/起身',
  'mode.skating': '滑行',
  'mode.headingHold': '航向锁定',
  'mode.on': '开',
  'mode.off': '关',
  'mode.updated': '模式已更新',
  'mode.hint': 'Hold: 站立姿态。Walk: 行走并自动恢复。',

  // Action buttons
  'action.pick': '拾取',
  'action.roulade': '翻滚',
  'action.sit': '坐下',
  'action.stand': '站起',
  'action.lKick': '左踢',
  'action.rKick': '右踢',
  'action.sitting': '坐下中',
  'action.standingUp': '站起中',
  'action.leftKick': '左踢',
  'action.rightKick': '右踢',

  // Section titles
  'section.mode': '模式',
  'section.actions': '动作',
  'section.headMouth': '头部和嘴部',
  'section.actionSettings': '动作设置',
  'section.imuFiltering': 'IMU 滤波',
  'section.walkRecovery': '行走与恢复',
  'section.imuServos': 'IMU 与舵机',
  'section.imuCalibration': 'IMU 校准',

  // Sliders
  'slider.actionScale': '动作幅度',
  'slider.legSmoothing': '腿部平滑',
  'slider.headSmoothing': '头部平滑',
  'slider.gyroSmoothing': '陀螺仪平滑',
  'slider.gravitySmoothing': '重力平滑',
  'slider.mouth': '嘴巴',

  // Recovery
  'recovery.currentAction': '当前动作',
  'recovery.tilt': '倾斜',
  'recovery.status': '状态',

  // Telemetry
  'telemetry.controlsReady': '控制就绪。',
  'telemetry.waitingFeedback': '等待反馈。',

  // IMU Calibration
  'calib.calibrate': '校准 IMU',
  'calib.reset': '重置 IMU 校准',
  'calib.calibrating': '校准中… {pct}%',
  'calib.error': '错误：检测到移动，请重新校准。',
  'calib.reading': '读取校准状态…',
  'calib.hint': '保持 Arduino 竖直，底边紧贴桌面，静止 1.5 秒。',

  // Connection modal
  'conn.title': '机器人连接',
  'conn.ipLabel': '机器人 IP 地址',
  'conn.portLabel': '端口',
  'conn.test': '测试连接',
  'conn.save': '保存',
  'conn.cancel': '取消',
  'conn.enterIp': '请输入机器人 IP 地址。',
  'conn.connected': '已连接',
  'conn.failed': '连接失败',
  'conn.mode': '模式',
  'conn.servos': '舵机',

  // Mode labels (getModeLabel)
  'modeLabel.shadow': '仅推理',
  'modeLabel.off': '力矩关闭',
  'modeLabel.hold': '默认姿态',
  'modeLabel.policy': '行走',
  'modeLabel.calibrate': '校准',
  'modeLabel.servoDebug': '舵机调试',
  'modeLabel.leftKick': '左踢',
  'modeLabel.rightKick': '右踢',
  'modeLabel.sit': '坐下',
  'modeLabel.stand': '站起',
  'modeLabel.enabled': '已启用',
  'modeLabel.torqueOff': '力矩关闭',

  // Recovery labels (getRecoveryLabel)
  'recLabel.idle': '空闲',
  'recLabel.stopped': '已停止',
  'recLabel.ready': '就绪',
  'recLabel.walking': '行走中',
  'recLabel.preparingGetUp': '准备起身',
  'recLabel.gettingUp': '起身中',
  'recLabel.preparing': '准备中',
  'recLabel.sitting': '坐下中',
  'recLabel.standingUp': '站起中',
  'recLabel.roulade': '翻滚',
  'recLabel.pick': '拾取',

  // Misc
  'misc.torqueOff': '力矩关闭',
};

const translations: Record<Lang, Record<string, string>> = {en, zh};

interface I18nStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: TFunc;
}

export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({lang}),
      toggleLang: () => set({lang: get().lang === 'en' ? 'zh' : 'en'}),
      t: (key, params) => {
        const {lang} = get();
        let str = translations[lang][key] ?? translations.en[key] ?? key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            str = str.replace(`{${k}}`, String(v));
          }
        }
        return str;
      },
    }),
    {
      name: '@duck_i18n',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({lang: s.lang}),
    },
  ),
);

/** React hook: subscribe to lang so components re-render on language change. */
export function useTranslation(): {t: TFunc; lang: Lang} {
  const lang = useI18n(s => s.lang);
  const t = useI18n(s => s.t);
  return {t, lang};
}
