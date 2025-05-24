
import { useState, useEffect } from "react";

interface ActivationState {
  support: boolean;
  telegram: boolean;
  aiAssistant: boolean;
  playerActivation: boolean;
}

const STORAGE_KEY = "course_activation_state";

export const useActivationState = (courseSlug: string) => {
  const [activations, setActivations] = useState<ActivationState>({
    support: false,
    telegram: false,
    aiAssistant: false,
    playerActivation: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${courseSlug}`);
    if (stored) {
      try {
        setActivations(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse activation state:", error);
      }
    }
  }, [courseSlug]);

  const updateActivation = (key: keyof ActivationState, value: boolean) => {
    const newState = { ...activations, [key]: value };
    setActivations(newState);
    localStorage.setItem(`${STORAGE_KEY}_${courseSlug}`, JSON.stringify(newState));
  };

  const resetActivations = () => {
    const resetState = {
      support: false,
      telegram: false,
      aiAssistant: false,
      playerActivation: false,
    };
    setActivations(resetState);
    localStorage.removeItem(`${STORAGE_KEY}_${courseSlug}`);
  };

  return {
    activations,
    updateActivation,
    resetActivations,
  };
};
