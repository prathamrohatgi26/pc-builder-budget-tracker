"use client";

import { useState, useEffect } from "react";
import {
  saveChecklistData,
  loadUserChecklist,
  updateUserBudget,
  updateUserCurrency,
  getCurrentUser,
  signOut,
} from "../lib/database";
import Auth from "./components/Auth";

// Currency configuration
const currencies = {
  INR: { symbol: "₹", name: "Indian Rupee" },
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  JPY: { symbol: "¥", name: "Japanese Yen" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
};

export default function Home() {
  const [checklist, setChecklist] = useState({
    // Core Components
    cpu: false,
    motherboard: false,
    ram: false,
    storage: false,
    gpu: false,
    psu: false,
    case: false,
    // Cooling
    cpuCooler: false,
  });

  const [prices, setPrices] = useState({
    cpu: 0,
    motherboard: 0,
    ram: 0,
    storage: 0,
    gpu: 0,
    psu: 0,
    case: 0,
    cpuCooler: 0,
  });

  const [partNames, setPartNames] = useState({
    cpu: "",
    motherboard: "",
    ram: "",
    storage: "",
    gpu: "",
    psu: "",
    case: "",
    cpuCooler: "",
  });

  const [totalBudget, setTotalBudget] = useState(100000); // Default 1 lakh
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [newBudget, setNewBudget] = useState(100000);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [otherComponents, setOtherComponents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newComponentName, setNewComponentName] = useState("");

  const toggleItem = (item) => {
    setChecklist((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const updatePrice = (item, price) => {
    setPrices((prev) => ({
      ...prev,
      [item]: parseFloat(price) || 0,
    }));
  };

  const updatePartName = (item, name) => {
    setPartNames((prev) => ({
      ...prev,
      [item]: name,
    }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    const currencyInfo = currencies[currency] || currencies.INR;
    return `${currencyInfo.symbol}${amount.toLocaleString()}`;
  };

  // Auto-save function
  const autoSave = async () => {
    try {
      await saveChecklistData(checklist, prices, partNames, totalBudget, currency, otherComponents);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  // Update budget
  const handleUpdateBudget = async () => {
    try {
      await updateUserBudget(newBudget);
      setTotalBudget(newBudget);
      setShowBudgetEditor(false);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to update budget:", error);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const data = await loadUserChecklist();
          if (data.checklist && Object.keys(data.checklist).length > 0) {
            setChecklist(data.checklist);
          }
          if (data.prices && Object.keys(data.prices).length > 0) {
            setPrices(data.prices);
          }
          if (data.partNames && Object.keys(data.partNames).length > 0) {
            setPartNames(data.partNames);
          }
          if (data.totalBudget) {
            setTotalBudget(data.totalBudget);
            setNewBudget(data.totalBudget);
          }
          if (data.currency && currencies[data.currency]) {
            setCurrency(data.currency);
          }
          if (data.otherComponents && Array.isArray(data.otherComponents)) {
            setOtherComponents(data.otherComponents);
          }
        } else {
          // Fallback to localStorage if not logged in
          const savedCurrency = localStorage.getItem("pc_builder_currency");
          if (savedCurrency && currencies[savedCurrency]) {
            setCurrency(savedCurrency);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setAuthLoading(false);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = (user) => {
    setUser(user);
    // Reload data after successful authentication
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setChecklist({
        cpu: false,
        motherboard: false,
        ram: false,
        storage: false,
        gpu: false,
        psu: false,
        case: false,
        cpuCooler: false,
      });
      setPrices({
        cpu: 0,
        motherboard: 0,
        ram: 0,
        storage: 0,
        gpu: 0,
        psu: 0,
        case: 0,
        cpuCooler: 0,
      });
      setPartNames({
        cpu: "",
        motherboard: "",
        ram: "",
        storage: "",
        gpu: "",
        psu: "",
        case: "",
        cpuCooler: "",
      });
      setOtherComponents([]);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  // Auto-save when checklist, prices, or part names change
  useEffect(() => {
    if (!isLoading && user) {
      const timeoutId = setTimeout(() => {
        autoSave();
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [checklist, prices, partNames, totalBudget, currency, otherComponents, isLoading, user]);

  const resetChecklist = async () => {
    const resetChecklistData = {};
    const resetPricesData = {};
    const resetPartNamesData = {};

    Object.keys(checklist).forEach((key) => {
      resetChecklistData[key] = false;
    });
    Object.keys(prices).forEach((key) => {
      resetPricesData[key] = 0;
    });
    Object.keys(partNames).forEach((key) => {
      resetPartNamesData[key] = "";
    });

    setChecklist(resetChecklistData);
    setPrices(resetPricesData);
    setPartNames(resetPartNamesData);
    setOtherComponents([]);

    // Save the reset data
    if (user) {
      try {
        await saveChecklistData(
          resetChecklistData,
          resetPricesData,
          resetPartNamesData,
          totalBudget,
          currency,
          []
        );
        setLastSaved(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Failed to save reset data:", error);
      }
    }
  };

  // Share build function
  const handleShareBuild = async () => {
    try {
      const currencyInfo = currencies[currency] || currencies.INR;
      let buildText = "PC Build Details\n";
      buildText += "=".repeat(50) + "\n\n";

      let hasItems = false;

      categories.forEach((category) => {
        const categoryItems = category.items.filter(
          (item) => checklist[item.key]
        );

        if (categoryItems.length > 0) {
          hasItems = true;
          buildText += `${category.title}\n`;
          buildText += "-".repeat(50) + "\n";

          categoryItems.forEach((item) => {
            buildText += `\n${item.label}`;
            if (partNames[item.key] && partNames[item.key].trim()) {
              buildText += `: ${partNames[item.key]}`;
            }
            if (prices[item.key] && prices[item.key] > 0) {
              buildText += ` - ${currencyInfo.symbol}${prices[item.key].toLocaleString()}`;
            }
            buildText += "\n";
          });

          buildText += "\n";
        }
      });

      // Add other components
      const checkedOtherComponents = otherComponents.filter((comp) => comp.checked);
      if (checkedOtherComponents.length > 0) {
        hasItems = true;
        buildText += "Other Components\n";
        buildText += "-".repeat(50) + "\n";
        checkedOtherComponents.forEach((comp) => {
          buildText += `\n${comp.name}`;
          if (comp.partName && comp.partName.trim()) {
            buildText += `: ${comp.partName}`;
          }
          if (comp.price && comp.price > 0) {
            buildText += ` - ${currencyInfo.symbol}${comp.price.toLocaleString()}`;
          }
          buildText += "\n";
        });
        buildText += "\n";
      }

      if (!hasItems) {
        buildText += "No items selected yet.\n";
      } else {
        buildText += "=".repeat(50) + "\n";
        buildText += `Total Spent: ${currencyInfo.symbol}${totalSpent.toLocaleString()}\n`;
        buildText += `Total Budget: ${currencyInfo.symbol}${totalBudget.toLocaleString()}\n`;
        buildText += `Remaining: ${currencyInfo.symbol}${remainingBudget.toLocaleString()}\n`;
      }

      await navigator.clipboard.writeText(buildText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy build:", error);
      alert("Failed to copy build to clipboard");
    }
  };

  // Handle currency change
  const handleCurrencyChange = async (newCurrency) => {
    setCurrency(newCurrency);
    
    // Save to database if user is logged in
    if (user) {
      try {
        await updateUserCurrency(newCurrency);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Failed to update currency:", error);
      }
    } else {
      // Fallback to localStorage if not logged in
      localStorage.setItem("pc_builder_currency", newCurrency);
    }
  };

  // Handle adding new component
  const handleAddComponent = () => {
    if (newComponentName.trim()) {
      const newComponent = {
        id: Date.now().toString(),
        name: newComponentName.trim(),
        checked: false,
        price: 0,
        partName: "",
      };
      setOtherComponents((prev) => [...prev, newComponent]);
      setNewComponentName("");
      setShowAddModal(false);
    }
  };

  // Handle removing component
  const handleRemoveComponent = (id) => {
    setOtherComponents((prev) => prev.filter((comp) => comp.id !== id));
  };

  // Handle toggling component
  const handleToggleOtherComponent = (id) => {
    setOtherComponents((prev) =>
      prev.map((comp) =>
        comp.id === id ? { ...comp, checked: !comp.checked } : comp
      )
    );
  };

  // Handle updating other component price
  const handleUpdateOtherComponentPrice = (id, price) => {
    setOtherComponents((prev) =>
      prev.map((comp) =>
        comp.id === id ? { ...comp, price: parseFloat(price) || 0 } : comp
      )
    );
  };

  // Handle updating other component part name
  const handleUpdateOtherComponentPartName = (id, partName) => {
    setOtherComponents((prev) =>
      prev.map((comp) =>
        comp.id === id ? { ...comp, partName } : comp
      )
    );
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  // Calculate budget totals
  const totalSpent =
    Object.keys(checklist)
      .filter((key) => checklist[key])
      .reduce((sum, key) => sum + (prices[key] || 0), 0) +
    otherComponents
      .filter((comp) => comp.checked)
      .reduce((sum, comp) => sum + (comp.price || 0), 0);

  const remainingBudget = totalBudget - totalSpent;
  const budgetPercentage = Math.round((totalSpent / totalBudget) * 100);

  const categories = [
    {
      title: "Core Components",
      items: [
        {
          key: "cpu",
          label: "Processor",
        },
        {
          key: "motherboard",
          label: "Motherboard",
        },
        {
          key: "ram",
          label: "RAM",
        },
        {
          key: "storage",
          label: "SSD",
        },
        {
          key: "gpu",
          label: "GPU",
        },
        {
          key: "psu",
          label: "PSU",
        },
        {
          key: "cpuCooler",
          label: "AIO / Air Cooler",
        },
        { key: "case", label: "PC Case" },
      ],
    },
  ];

  // Show auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth component if not logged in
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Show loading for data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading your checklist...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h1
              className="text-3xl sm:text-7xl font-bold text-slate-800 dark:text-slate-200 text-center sm:text-left"
              style={{ fontFamily: "var(--font-custom)" }}
            >
              PC Parts Checklist
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleShareBuild}
                className={`px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                  copySuccess
                    ? "bg-green-600 text-white"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {copySuccess ? "✓ Copied!" : "Share Build"}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base"
              >
                Sign Out
              </button>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Complete checklist for building your PC
          </p>

          {/* Budget Management */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => setShowBudgetEditor(!showBudgetEditor)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showBudgetEditor ? 'Cancel' : 'Update Budget'}
                </button>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Current Budget: {formatCurrency(totalBudget)}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 dark:text-slate-400">
                    Currency:
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {Object.entries(currencies).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.symbol} {code} - {info.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {lastSaved && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Last saved: {lastSaved}
                </div>
              )}
            </div>

            {/* Budget Editor */}
            {showBudgetEditor && (
              <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  Update Your Budget
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      New Budget ({currencies[currency]?.symbol || "₹"})
                    </label>
                    <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your budget"
                      min="0"
                    />
                  </div>
                  <button
                    onClick={handleUpdateBudget}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Update Budget
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Budget Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Budget Tracker
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalBudget)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total Budget
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalSpent)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total Spent
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                <div
                  className={`text-2xl font-bold ${
                    remainingBudget >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(remainingBudget)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Remaining
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  budgetPercentage > 100
                    ? "bg-red-500"
                    : budgetPercentage > 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="text-center mt-2 text-sm text-slate-600 dark:text-slate-400">
              {budgetPercentage}% of budget used
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                Progress: {completedCount}/{totalCount} items
              </span>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={resetChecklist}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Reset Checklist
              </button>
              {lastSaved && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Last saved: {lastSaved}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checklist Categories */}
        <div className="space-y-6">
          {categories.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="bg-slate-100 dark:bg-slate-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  {category.title}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                        checklist[item.key]
                          ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                          : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                      }`}
                      onClick={() => toggleItem(item.key)}
                    >
                      <div className="flex items-center justify-center w-6 h-6 mr-4">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            checklist[item.key]
                              ? "bg-green-500 border-green-500"
                              : "border-slate-300 dark:border-slate-500"
                          }`}
                        >
                          {checklist[item.key] && (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-medium ${
                            checklist[item.key]
                              ? "text-green-800 dark:text-green-200 line-through"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {item.label}
                        </h3>
                        <p
                          className={`text-sm ${
                            checklist[item.key]
                              ? "text-green-600 dark:text-green-400"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {item.description}
                        </p>
                        {checklist[item.key] && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Part Name
                              </label>
                              <input
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                type="text"
                                value={partNames[item.key] || ""}
                                onChange={(e) =>
                                  updatePartName(item.key, e.target.value)
                                }
                                placeholder="Enter part name/model"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Price ({currencies[currency]?.symbol || "₹"})
                              </label>
                              <input
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                type="number"
                                value={prices[item.key] || ""}
                                onChange={(e) =>
                                  updatePrice(item.key, e.target.value)
                                }
                                placeholder="Enter price"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
             {/* Add Component Button */}
             <div className="flex justify-center my-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Component
                  </button>
                </div>
        </div>

        {/* Other Components Section */}
        {otherComponents.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Other Components
              </h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4">
                {otherComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${
                      comp.checked
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                        : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6 mr-4">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                          comp.checked
                            ? "bg-green-500 border-green-500"
                            : "border-slate-300 dark:border-slate-500"
                        }`}
                        onClick={() => handleToggleOtherComponent(comp.id)}
                      >
                        {comp.checked && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`font-medium capitalize ${
                            comp.checked
                              ? "text-green-800 dark:text-green-200 line-through"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {comp.name}
                        </h3>
                        <button
                          onClick={() => handleRemoveComponent(comp.id)}
                          className="ml-4 px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove component"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                      {comp.checked && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Part Name
                            </label>
                            <input
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              type="text"
                              value={comp.partName || ""}
                              onChange={(e) =>
                                handleUpdateOtherComponentPartName(
                                  comp.id,
                                  e.target.value
                                )
                              }
                              placeholder="Enter part name/model"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Price ({currencies[currency]?.symbol || "₹"})
                            </label>
                            <input
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              type="number"
                              value={comp.price || ""}
                              onChange={(e) =>
                                handleUpdateOtherComponentPrice(
                                  comp.id,
                                  e.target.value
                                )
                              }
                              placeholder="Enter price"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Component Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Add New Component
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Component Name
                </label>
                <input
                  type="text"
                  value={newComponentName}
                  onChange={(e) => setNewComponentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddComponent();
                    }
                  }}
                  placeholder="e.g., RGB Strips, Fan Controller"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewComponentName("");
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComponent}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Component
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-slate-600 dark:text-slate-400">
          <p>Happy building! 🚀</p>
        </div>
      </div>
    </div>
  );
}