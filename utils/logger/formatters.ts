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
      return `${base}\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    return base;
  },

  error(error: Error): string {
    return `${error.message}\nStack: ${error.stack}`;
  },
};
