export type ErrorDetails = Record<string, unknown> | unknown[];

export function errorBody(
  code: string,
  message: string,
  requestId: string,
  details?: ErrorDetails,
) {
  return {
    error: {
      code,
      message,
      details: details ?? {},
      requestId,
    },
  };
}
