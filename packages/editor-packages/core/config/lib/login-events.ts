export const LOGIN_EVENT = "login" as const;
export const VERIFY_OTP_EVENT = "verify-otp" as const;

export const SOOQ_INPUT_ATTR = "data-sooq-input";

export type LoginEventDetail = Record<string, string>;

export function collectSooqInputValues(scope: ParentNode): LoginEventDetail {
  const inputs = scope.querySelectorAll<HTMLInputElement>(
    `[${SOOQ_INPUT_ATTR}][name]`
  );
  const values: LoginEventDetail = {};

  inputs.forEach((input) => {
    if (input.name) {
      values[input.name] = input.value;
    }
  });

  return values;
}

function dispatchCustom(name: string, values: LoginEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LoginEventDetail>(name, {
      detail: values,
      bubbles: true,
    })
  );
}

export function dispatchLoginEvent(values: LoginEventDetail) {
  dispatchCustom(LOGIN_EVENT, values);
}

export function dispatchVerifyOtpEvent(values: LoginEventDetail) {
  dispatchCustom(VERIFY_OTP_EVENT, values);
}
