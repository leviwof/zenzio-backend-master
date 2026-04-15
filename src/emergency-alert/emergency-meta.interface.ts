export interface EmergencyMeta {
  speed?: number;
  app_version?: string;
  signal_strength?: string;
  battery?: number;

  // ADD THIS ↓↓↓↓↓
  resolution_note?: string;

  // allow additional dynamic fields safely
  [key: string]: any;
}
