import React from "react";
import { ChevronDown } from "lucide-react";

export type CurrencyCode = "INR" | "USD";

interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  name: string;
  description: string;
}

interface CurrencySwitcherProps {
  value?: CurrencyCode;
  onChange?: (currency: CurrencyCode) => void;
  className?: string;
}

export const CURRENCY_STORAGE_KEY = "preferredCurrency";
export const CURRENCY_CHANGED_EVENT = "currency:changed";

const currencies: CurrencyOption[] = [
  {
    code: "INR",
    symbol: "₹",
    name: "INR",
    description: "Indian Rupee",
  },
  {
    code: "USD",
    symbol: "$",
    name: "USD",
    description: "US Dollar",
  },
];

const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [selectedCurrency, setSelectedCurrency] =
    React.useState<CurrencyOption>(currencies[0]);

  const getCurrencyFromCode = React.useCallback(
    (code: CurrencyCode | undefined | null) =>
      currencies.find((currency) => currency.code === code) ?? currencies[0],
    []
  );

  React.useEffect(() => {
    const storedCurrency =
      typeof window !== "undefined"
        ? (localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null)
        : null;
    const controlledCurrency = value ?? storedCurrency;
    setSelectedCurrency(getCurrencyFromCode(controlledCurrency));
    setMounted(true);
  }, [value, getCurrencyFromCode]);

  React.useEffect(() => {
    if (value) {
      setSelectedCurrency(getCurrencyFromCode(value));
    }
  }, [value, getCurrencyFromCode]);

  const updateCurrency = (currency: CurrencyOption) => {
    setSelectedCurrency(currency);
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency.code);
      window.dispatchEvent(
        new CustomEvent(CURRENCY_CHANGED_EVENT, { detail: currency.code })
      );
    }
    onChange?.(currency.code);
    setIsOpen(false);
  };

  if (!mounted) {
    return (
      <button
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 transition-all duration-200 ${className}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <span className="text-lg">{selectedCurrency.symbol}</span>
        <span className="hidden sm:inline text-xs font-semibold uppercase">
          {selectedCurrency.code}
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 transition-all duration-200"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select currency"
        data-testid="currency-switcher-button"
      >
        <span className="text-lg">{selectedCurrency.symbol}</span>
        <span className="hidden sm:block text-xs font-semibold uppercase tracking-wide">
          {selectedCurrency.code}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            <div className="py-1.5">
              {currencies.map((currency) => {
                const isActive = currency.code === selectedCurrency.code;
                return (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => updateCurrency(currency)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-all duration-150 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-l-4 border-blue-500"
                        : "text-gray-700 border-l-4 border-transparent hover:bg-gray-50"
                    }`}
                    role="option"
                    aria-selected={isActive}
                    data-testid={`currency-option-${currency.code.toLowerCase()}`}
                  >
                    <span className="text-lg font-semibold">
                      {currency.symbol}
                    </span>
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-sm">
                        {currency.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {currency.description}
                      </span>
                    </div>
                    {isActive && (
                      <span className="text-blue-600 font-bold text-sm">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySwitcher;
