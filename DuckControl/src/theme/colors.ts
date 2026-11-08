export const colors = {
  background: '#ffffff',
  card: '#f5f5f7',
  border: '#e0e0e0',
  text: '#1a1a1a',
  textSecondary: '#666666',
  accent: '#007aff',
  // Premium button palette — muted slate-blue with depth
  button: '#4a5b7b',
  buttonPressed: '#3a4a68',
  buttonShadow: '#2a3a52',
  buttonHover: '#0051b5',
  // Ghost / secondary buttons
  buttonGhost: '#eef1f6',
  buttonGhostText: '#4a5b7b',
  buttonGhostBorder: '#d5dae3',
  // Danger — muted terracotta
  danger: '#c4554d',
  dangerPressed: '#a8453e',
  dangerBorder: '#cc2e26',
  warning: '#ff9500',
  inputBg: '#f0f0f0',
  joyZone: '#f5f5f7',
  joyBorder: '#cccccc',
  joyCross: '#e0e0e055',
  knob: '#4a5b7b',
  warnBg: '#fff3e0',
  warnBorder: '#ffb74d',
  doneBg: '#e8f5e9',
  doneBorder: '#4caf50',
  navActive: '#007aff',
} as const;

export type ColorKey = keyof typeof colors;
