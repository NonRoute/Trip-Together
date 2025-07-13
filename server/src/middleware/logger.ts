import type { Context, Next } from "hono";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// Get status color based on HTTP status code
const getStatusColor = (status: number) => {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  if (status >= 200) return colors.green;
  return colors.gray;
};

// Get method color
const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return colors.green;
    case "POST":
      return colors.blue;
    case "PUT":
      return colors.yellow;
    case "DELETE":
      return colors.red;
    case "PATCH":
      return colors.magenta;
    default:
      return colors.gray;
  }
};

export const loggerMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;
  const timestamp = new Date().toISOString();

  // Log request
  //   console.log(
  //     `${colors.gray}[${timestamp}]${colors.reset} ` +
  //       `${getMethodColor(method)}${method.padEnd(6)}${colors.reset} ` +
  //       `${colors.cyan}${url}${colors.reset} - Request started`,
  //   );

  try {
    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    // Log successful response
    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ` +
        `${getMethodColor(method)}${method.padEnd(6)}${colors.reset} ` +
        `${colors.cyan}${url}${colors.reset} - ` +
        `${getStatusColor(status)}${status}${colors.reset} ` +
        `${colors.gray}(${duration}ms)${colors.reset}`,
    );
  } catch (error) {
    const duration = Date.now() - start;

    // Log error
    console.error(
      `${colors.gray}[${timestamp}]${colors.reset} ` +
        `${getMethodColor(method)}${method.padEnd(6)}${colors.reset} ` +
        `${colors.cyan}${url}${colors.reset} - ` +
        `${colors.red}ERROR${colors.reset} ` +
        `${colors.red}${
          error instanceof Error ? error.message : String(error)
        }${colors.reset} ` +
        `${colors.gray}(${duration}ms)${colors.reset}`,
    );

    throw error;
  }
};
