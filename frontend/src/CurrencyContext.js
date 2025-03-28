import React, { createContext, useState, useEffect } from "react";

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState("GBP"); // Default to GBP

    useEffect(() => {
        const savedCurrency = localStorage.getItem("currency");
        if (savedCurrency) {
            console.log("Loading saved currency:", savedCurrency);
            setCurrency(savedCurrency);  // Load saved currency on page reload
        }
    }, []); // Only run once when the component mounts

    const updateCurrency = (newCurrency) => {
        console.log("Updating currency to:", newCurrency);
        setCurrency(newCurrency);
        localStorage.setItem("currency", newCurrency); // Save to localStorage
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency: updateCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};
