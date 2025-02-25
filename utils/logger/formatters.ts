import { LogEntry } from "./types";

export const formatters = {
  timestamp(): string {
    return new Date().toISOString();
  },

  logEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${
      entry.message
    }`;

    if (entry.error) {
      return `${base}\nError: ${entry.error.message}\nStack: ${entry.error.stack}`;
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      return `${base}\nMetadata: ${JSON.stringify(entry.metadata, (key, value) => {
        // Handle BigInt values
        if (typeof value === 'bigint') {
          return value.toString();
        }
        
        // Handle array buffers and typed arrays (often in blockchain responses)
        if (value && value.constructor && (
          value.constructor.name === 'ArrayBuffer' || 
          value.constructor.name.includes('Array')
        )) {
          // Convert buffers to hexadecimal representation
          if (value.constructor.name === 'ArrayBuffer') {
            return Array.from(new Uint8Array(value))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
          }
          
          // For typed arrays, convert to regular array
          if (typeof value.map === 'function') {
            return Array.from(value);
          }
        }
        
        return value;
      }, 2)}`;
    }

    return base;
  },

  error(error: Error): string {
    return `${error.message}\nStack: ${error.stack}`;
  },
};
