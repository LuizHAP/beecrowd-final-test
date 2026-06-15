import { Injectable, LoggerService } from "@nestjs/common";
import pino, { Logger as PinoLogger } from "pino";

@Injectable()
export class LoggingService implements LoggerService {
  private logger: PinoLogger;

  constructor() {
    this.logger = pino({
      transport: {
        target: "pino/file",
        options: { destination: 1 },
      },
      base: { pid: false },
    });
  }

  child(context: string, _bindings?: Record<string, unknown>): LoggingService {
    const child = new LoggingService();
    (child as any).logger = this.logger.child({
      context: context ?? "unknown",
    });
    return child;
  }

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.info({ ...meta }, message);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info({ ...meta }, message);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn({ ...meta }, message);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error({ ...meta }, message);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug({ ...meta }, message);
  }

  fatal(message: string, meta?: Record<string, unknown>) {
    this.logger.fatal({ ...meta }, message);
  }
}
