type LogLevel = "info" | "warn" | "error";

const SENSITIVE_KEY_PATTERN = /password|token|secret|apiKey|authorization|cookie|key/i;

function sanitize(val: unknown, depth = 0): unknown {
  if (depth > 4) return "[DEPTH_EXCEEDED]";
  if (val === null || val === undefined) return val;
  if (typeof val === "string") {
    return val;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return val;
  }
  if (val instanceof Error) {
    return {
      name: val.name,
      message: val.message,
      stack: process.env.NODE_ENV === "production" ? undefined : val.stack,
    };
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitize(item, depth + 1));
  }
  if (typeof val === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        clean[k] = "[REDACTED]";
      } else {
        clean[k] = sanitize(v, depth + 1);
      }
    }
    return clean;
  }
  return String(val);
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>, err?: unknown) {
  const isProd = process.env.NODE_ENV === "production";
  const timestamp = new Date().toISOString();
  const sanitizedContext = context ? (sanitize(context) as Record<string, unknown>) : undefined;
  const sanitizedError = err ? sanitize(err) : undefined;

  if (isProd) {
    const entry = {
      timestamp,
      level,
      message,
      ...(sanitizedContext ? { context: sanitizedContext } : {}),
      ...(sanitizedError ? { error: sanitizedError } : {}),
    };
    // In production, output single-line structured JSON
    const output = JSON.stringify(entry);
    if (level === "error") {
      process.stderr.write(output + "\n");
    } else {
      process.stdout.write(output + "\n");
    }
  } else {
    // In development / test, print clean format
    const prefix = `[${level.toUpperCase()}] ${message}`;
    if (level === "error") {
      console.error(prefix, sanitizedContext || "", sanitizedError || "");
    } else if (level === "warn") {
      console.warn(prefix, sanitizedContext || "");
    } else {
      console.log(prefix, sanitizedContext || "");
    }
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    writeLog("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    writeLog("warn", message, context);
  },
  error(message: string, err?: unknown, context?: Record<string, unknown>) {
    writeLog("error", message, context, err);
  },
};
