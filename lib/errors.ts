export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class SlotUnavailableError extends AppError {
  constructor(message = "That time is no longer available.") {
    super(message, "SLOT_UNAVAILABLE", 409);
  }
}

export class PaymentExceptionError extends AppError {
  constructor(message: string) {
    super(message, "PAYMENT_EXCEPTION", 409);
  }
}
