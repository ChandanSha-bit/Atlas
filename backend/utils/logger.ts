import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, requestId, stack }) => {
      const rid = requestId ? ` [${requestId}]` : '';
      return `${timestamp} ${(level as string).toUpperCase()}${rid}: ${message}${stack ? '\n' + stack : ''}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
