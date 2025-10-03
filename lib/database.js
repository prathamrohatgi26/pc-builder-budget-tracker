import { supabase } from "./supabase";

// Save checklist, prices, and part names to database
export const saveChecklistData = async (
  checklist,
  prices,
  partNames = {},
  totalBudget = 100000
) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("pc_checklist")
      .upsert({
        user_id: user.id,
        checklist_data: checklist,
        prices_data: prices,
        part_names_data: partNames,
        total_budget: totalBudget,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error saving checklist data:", error);
    throw error;
  }
};

// Load user's checklist (one per user)
export const loadUserChecklist = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("pc_checklist")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (data) {
      return {
        checklist: data.checklist_data || {},
        prices: data.prices_data || {},
        partNames: data.part_names_data || {},
        totalBudget: data.total_budget || 100000,
      };
    }

    return { checklist: {}, prices: {}, partNames: {}, totalBudget: 100000 };
  } catch (error) {
    console.error("Error loading user checklist:", error);
    return { checklist: {}, prices: {}, partNames: {}, totalBudget: 100000 };
  }
};

// Update user's budget
export const updateUserBudget = async (newBudget) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("pc_checklist")
      .upsert({
        user_id: user.id,
        total_budget: newBudget,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating budget:", error);
    throw error;
  }
};

// Generate a unique session ID
export const generateSessionId = () => {
  return (
    "checklist_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  );
};

// Get or create session ID from localStorage
export const getSessionId = () => {
  if (typeof window !== "undefined") {
    let sessionId = localStorage.getItem("pc_checklist_session_id");
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem("pc_checklist_session_id", sessionId);
    }
    return sessionId;
  }
  return generateSessionId();
};

// Authentication functions
export const signUp = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};
