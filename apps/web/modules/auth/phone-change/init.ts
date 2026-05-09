import type {
  RequestPhoneChangeInput,
  VerifyPhoneChangeInput,
} from "./types"

export const requestPhoneChangeDefaultValues: RequestPhoneChangeInput = {
  newPhone: "",
}

export const verifyPhoneChangeDefaultValues: VerifyPhoneChangeInput = {
  newPhone: "",
  otpCode: "",
}
