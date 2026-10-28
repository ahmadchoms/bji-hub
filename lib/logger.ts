import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|apiKey|authorization|cookie|key|credential|pin|cvv|phone|telephone|rekening|accountNumber/i;

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val) && !(val instanceof Error);
}

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
    const output = JSON.stringify(entry);
    if (level === "error") {
      process.stderr.write(output + "\n");
    } else {
      process.stdout.write(output + "\n");
    }
  } else {
    const prefix = `[${level.toUpperCase()}] ${message}`;
    if (level === "error") {
      console.error(prefix, sanitizedContext || "", sanitizedError || "");
    } else if (level === "warn") {
      console.warn(prefix, sanitizedContext || "");
    } else {
      console.log(prefix, sanitizedContext || "");
    }
  }

  // S4: Bridge error level to Sentry in production
  if (level === "error") {
    try {
      const errorToCapture = err instanceof Error ? err : new Error(message);
      Sentry.captureException(errorToCapture, {
        tags: { event: message },
        extra: sanitizedContext || {},
      });
    } catch {
      // Sentry capture failure should never break runtime logging
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
  // A6: Flexible argument order: supports (msg, err, ctx) and (msg, ctx)
  error(message: string, errOrContext?: unknown, maybeContext?: Record<string, unknown>) {
    const ctxOnly = maybeContext === undefined && isPlainObject(errOrContext);
    const context = ctxOnly ? (errOrContext as Record<string, unknown>) : maybeContext;
    const err = ctxOnly ? undefined : errOrContext;
    writeLog("error", message, context, err);
  },
};
