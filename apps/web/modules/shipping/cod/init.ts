export const initCodReconciliationBatch = () => {
  return {
    shippingProviderId: "",
    providerFeePercentage: 5,
    settlementDate: new Date().toISOString().slice(0, 10),
    notes: "",
  }
}