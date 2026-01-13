const { useState, useEffect } = React;

const translations = {
  fr: { title: "Réservation de casque", chooseSession: "Choisissez votre session", reserve: "Réserver maintenant", coachMode: "Mode Coach" },
  en: { title: "Headset Reservation", chooseSession: "Choose your session", reserve: "Reserve now", coachMode: "Coach Mode" },
  de: { title: "Kopfhörer-Reservierung", chooseSession: "Wähle deine Session", reserve: "Jetzt reservieren", coachMode: "Coach-Modus" }
};

const defaultConfig = {
  background_color: "#020617", gradient_color: "#3b0764", primary_color: "#d91cd2", secondary_color: "#8b5cf6",
  text_color: "#ffffff", font_family: "system-ui", font_size: 16, app_title: "Afroboost",
  app_subtitle: "Réservation de casque", concept_description: "Le concept Afroboost : cardio + danse afrobeat + casques audio immersifs.",
  choose_session_text: "Choisissez votre session", choose_offer_text: "Choisissez votre offre",
  user_info_text: "Vos informations", button_text: "Réserver maintenant"
};

const DEFAULT_COURSES = [
  { id: "wed", name: "Afroboost Silent – Session Cardio", weekday: 3, time: "18:30", locationName: "Rue des Vallangines 97, Neuchâtel", mapsUrl: "" },
  { id: "sun", name: "Afroboost Silent – Sunday Vibes", weekday: 0, time: "18:30", locationName: "Rue des Vallangines 97, Neuchâtel", mapsUrl: "" }
];

const load = (key, fallback) => {
  const raw = localStorage.getItem(key);
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function getNextOccurrences(weekday, count = 4) {
  const now = new Date();
  const results = [];
  let diff = weekday - now.getDay();
  if (diff < 0) diff += 7;
  let current = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  for (let i = 0; i < count; i++) {
    results.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return results;
}

function formatDate(d, time) {
  return d.toLocaleDateString("fr-CH", { weekday: "short", day: "2-digit", month: "2-digit" }) + " • " + time;
}

// --- LA SUITE DU CODE CI-DESSOUS ---
