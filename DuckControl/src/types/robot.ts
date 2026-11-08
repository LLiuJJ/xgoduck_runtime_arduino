/** TypeScript types for the duck robot API — aligned with python/main.py and assets/app.js. */

export type RobotMode =
  | 'shadow'
  | 'off'
  | 'hold'
  | 'policy'
  | 'calibrate'
  | 'servo_debug';

export type SitstandAction = 'sit' | 'stand';

export type ImuCalibAction = 'start' | 'reset';

export interface MotionLimits {
  forward: number;
  backward: number;
  strafe: number;
  yaw: number;
}

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Vec15 = number[];

export interface RecoveryState {
  active: boolean;
  phase: string;
  angle_deg: number | null;
}

export interface PickState {
  active: boolean;
}

export interface RouladeState {
  active: boolean;
}

export interface SitstandState {
  active: boolean;
  phase: 'idle' | 'sit' | 'stand';
}

export interface KickState {
  active: boolean;
  side: 'left' | 'right';
}

export interface HeadingHoldState {
  enabled: boolean;
}

export interface RollerState {
  enabled: boolean;
}

export interface DeploymentSettings {
  action_scale: number;
  action_alpha: number;
  action_alpha_head: number;
  gyro_alpha: number;
  gravity_tau_s: number;
}

export interface ImuCalibrationState {
  active: boolean;
  progress: number;
  state: string;
  message: string;
  calibrated: boolean;
}

export interface ActionPreparationState {
  active: boolean;
  action: string | null;
}

export interface RobotStatus {
  mode: RobotMode;
  enabled: boolean;
  control_ready: boolean;
  feedback_hz: number;
  inference_hz: number;
  feedback_age_ms: number | null;
  servo_ids: number[];
  servo_count: number;
  imu_ok: boolean;
  voltage_v: number | null;
  last_error: string;

  acc: Vec3;
  acc_corrected: Vec3 | null;
  gyro: Vec3;
  gyro_corrected: Vec3 | null;
  gravity: Vec3;

  angles: Vec15;
  targets: Vec15;
  motors: number[];

  recovery: RecoveryState;
  pick: PickState | null;
  roulade: RouladeState | null;
  sitstand: SitstandState | null;
  left_kick: KickState | null;
  right_kick: KickState | null;
  heading_hold: HeadingHoldState;
  roller: RollerState;
  deployment: DeploymentSettings;
  imu_calibration: ImuCalibrationState | null;
  action_preparation: ActionPreparationState | null;
  mouth: number;

  raw_mask: number;
  raw_pos: Vec15 | null;
  cal_done: boolean[];
  mcu_servo_debug: boolean;
  servo_scan_version: number;
}

export interface CommandPayload {
  twist: Vec3;
  head: Vec4;
  mouth: number;
}

export interface ModeResponse {
  mode: RobotMode;
}

export interface RollerResponse {
  enabled: boolean;
}

export interface HeadingHoldResponse {
  enabled: boolean;
}

export interface FilterResponse {
  leg: number;
  head: number;
}

export interface ImuFilterResponse {
  gyro_alpha: number;
  gravity_tau_s: number;
}

export interface ActionScaleResponse {
  action_scale: number;
}

export interface SitstandResponse {
  active: boolean;
  phase: 'idle' | 'sit' | 'stand';
}

export interface KickResponse {
  active: boolean;
  side: 'left' | 'right';
}

export interface PickResponse {
  active: boolean;
}

export interface ImuCalibrationResponse {
  active: boolean;
  progress: number;
  state: string;
  message: string;
  calibrated: boolean;
}
