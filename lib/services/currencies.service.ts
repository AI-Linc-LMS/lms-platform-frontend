import apiClient from "./api";

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  /** Decimal places in the minor unit: 0 for JPY-likes, 3 for the Gulf dinars, 2 otherwise. */
  decimals: number;
}

/**
 * What a course may be priced in.
 *
 * Served from the same module the backend validator reads, so the dropdown can never offer a
 * currency the server would reject — which would otherwise let an admin create a course nobody
 * can buy.
 */
export const currenciesService = {
  list: async (): Promise<CurrencyOption[]> => {
    const res = await apiClient.get<{ currencies: CurrencyOption[] }>("/payment-gateway/api/currencies/");
    return res.data?.currencies ?? [];
  },
};
