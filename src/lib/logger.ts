type Level = 'debug' | 'info' | 'warn' | 'error';

type Meta = Record<string, unknown> | undefined;

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

function emit(level: Level, msg: string, meta?: Meta) {
  if (level === 'debug' && !isDev) return;
  const prefix = `[DulSai:${level}]`;
  const args: unknown[] = [prefix, msg];
  if (meta !== undefined) args.push(meta);
  if (level === 'error') {
    console.error(...args);
  } else if (level === 'warn') {
    console.warn(...args);
  } else {
    console.log(...args);
  }
}

export const logger = {
  debug: (msg: string, meta?: Meta) => emit('debug', msg, meta),
  info: (msg: string, meta?: Meta) => emit('info', msg, meta),
  warn: (msg: string, meta?: Meta) => emit('warn', msg, meta),
  error: (msg: string, meta?: Meta) => emit('error', msg, meta),
};
