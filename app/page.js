"use client";

import { useState, useEffect } from "react";
import {
  saveChecklistData,
  loadChecklistData,
  getSessionId,
  getCurrentUser,
  signOut,
} from "../lib/database";
import Auth from "./components/Auth";

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

  const totalBudget = 110000; // 1.1L in rupees
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  // Auto-save function
  const autoSave = async () => {
    if (sessionId) {
      try {
        await saveChecklistData(checklist, prices, sessionId, partNames);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const session = getSessionId();
          setSessionId(session);

          const data = await loadChecklistData(session);
          if (data.checklist && Object.keys(data.checklist).length > 0) {
            setChecklist(data.checklist);
          }
          if (data.prices && Object.keys(data.prices).length > 0) {
            setPrices(data.prices);
          }
          if (data.partNames && Object.keys(data.partNames).length > 0) {
            setPartNames(data.partNames);
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
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  // Auto-save when checklist, prices, or part names change
  useEffect(() => {
    if (!isLoading && sessionId) {
      const timeoutId = setTimeout(() => {
        autoSave();
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [checklist, prices, partNames, sessionId, isLoading]);

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

    // Save the reset data
    if (sessionId) {
      try {
        await saveChecklistData(
          resetChecklistData,
          resetPricesData,
          sessionId,
          resetPartNamesData
        );
        setLastSaved(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Failed to save reset data:", error);
      }
    }
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  // Calculate budget totals
  const totalSpent = Object.keys(checklist)
    .filter((key) => checklist[key])
    .reduce((sum, key) => sum + (prices[key] || 0), 0);

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
          label: "AIO/Air Cooler",
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
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-200 text-center sm:text-left">
              PC Parts Checklist
            </h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base"
            >
              Sign Out
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Complete checklist for building your PC
          </p>

          {/* Budget Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Budget Tracker
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{totalBudget.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total Budget
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ₹{totalSpent.toLocaleString()}
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
                  ₹{remainingBudget.toLocaleString()}
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
                                Price (₹)
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
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-600 dark:text-slate-400">
          <p>Happy building! 🚀</p>
        </div>
      </div>
    </div>
  );
}
