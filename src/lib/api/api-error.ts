/** One invalid body field, as returned in a 422 `ErrorResponse.errors`. */
export type FieldError = { field: string; message: string }

/**
 * Every failed request throws this, whatever the server sent back.
 * `status` is 0 when the request never got a response (offline, CORS, aborted).
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: FieldError[]

  constructor(options: {
    status: number
    code: string
    message: string
    fieldErrors?: FieldError[]
    cause?: unknown
  }) {
    super(options.message, { cause: options.cause })
    this.name = "ApiError"
    this.status = options.status
    this.code = options.code
    this.fieldErrors = options.fieldErrors ?? []
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isValidationError() {
    return this.status === 422
  }

  get isNetworkError() {
    return this.status === 0
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
