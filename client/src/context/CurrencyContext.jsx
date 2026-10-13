import React, { createContext, useState, useContext } from 'react';

const CurrencyContext = createContext();

const RATES = {
  INR: 1,
  USD: 0.012, // Example rate (1 INR = 0.012 USD)
  EUR: 0.011,
};

const SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('INR');

  const formatPrice = (amountInINR) => {
    const converted = (amountInINR * RATES[currency]).toFixed(2);
    return `${SYMBOLS[currency]} ${converted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);