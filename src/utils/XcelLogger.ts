export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

let loggingEnabled = false;

/** Enable or disable SDK logging. */
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled;
}

/** Log a message if logging is enabled. */
export function log(message: string, level: LogLevel = 'INFO'): void {
  if (!loggingEnabled) return;
  const tag = `[XcelPayGate][${level}]`;
  switch (level) {
    case 'ERROR':
      console.error(`${tag} ${message}`);
      break;
    case 'WARN':
      console.warn(`${tag} ${message}`);
      break;
    default:
      console.log(`${tag} ${message}`);
  }
}
