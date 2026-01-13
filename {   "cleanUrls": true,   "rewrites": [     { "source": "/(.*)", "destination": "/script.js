const { useState, useEffect } = React;

// --- RÉGLAGES ET TEXTES ---
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

const load = (key, fallback) => {
  const raw = localStorage.getItem(key);
  try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
};

const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// --- APPLICATION PRINCIPALE ---
function App() {
  const [lang, setLang] = useState("fr");
  const [config, setConfig] = useState(load("af_config", defaultConfig));
  const [coachMode, setCoachMode] = useState(localStorage.getItem("isCoachLoggedIn") === "true");
  const [showCoachLogin, setShowCoachLogin] = useState(false);
  
  // Nouveaux champs de connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const t = (key) => translations[lang][key] || key;

  // CONNEXION EMAIL + MOT DE PASSE
  const handleLogin = (e) => {
    e.preventDefault();
    // Identifiants par défaut (tu pourras les changer)
    if (loginEmail === "coach@afroboost.com" && loginPassword === "Afroboost2026") {
      localStorage.setItem("isCoachLoggedIn", "true");
      setCoachMode(true);
      setShowCoachLogin(false);
      setLoginError("");
    } else {
      setLoginError("Email ou mot de passe incorrect.");
    }
  };

  // MOT DE PASSE OUBLIÉ (Envoi d'un email)
  const handleForgotPw = () => {
    const email = "coach@afroboost.com";
    const subject = encodeURIComponent("Demande de nouveau mot de passe Afroboost");
    const body = encodeURIComponent("Bonjour, j'ai oublié mon mot de passe pour l'espace Coach Afroboost.");
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  // QUITTER LE MODE COACH
  const logout = () => {
    localStorage.removeItem("isCoachLoggedIn");
    setCoachMode(false);
  };

  // SI ON EST SUR L'ÉCRAN DE CONNEXION
  if (showCoachLogin) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-6" style={{background: config.background_color}}>
        <div className="glass rounded-xl p-8 max-w-md w-full neon-border">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{color: config.text_color}}>Accès Coach</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block mb-2 text-sm" style={{color: config.text_color}}>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 rounded glass text-white border-none" placeholder="coach@afroboost.com" required />
            </div>
            <div className="mb-6">
              <label className="block mb-2 text-sm" style={{color: config.text_color}}>Mot de passe</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-3 rounded glass text-white border-none" placeholder="••••••••" required />
            </div>
            {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
            <button type="submit" className="btn-primary w-full py-3 rounded-lg font-bold mb-4 text-white">Se connecter</button>
            <button type="button" onClick={handleForgotPw} className="w-full text-xs opacity-60 mb-6 hover:opacity-100 underline" style={{color: config.text_color}}>Mot de passe oublié ?</button>
            <button type="button" onClick={() => setShowCoachLogin(false)} className="w-full py-2 rounded glass text-sm" style={{color: config.text_color}}>Retour au site</button>
          </form>
        </div>
      </div>
    );
  }

  // ÉCRAN PRINCIPAL DU SITE
  return (
    <div className="min-h-screen p-6 text-center" style={{background: `radial-gradient(circle at top, ${config.gradient_color} 0%, ${config.background_color} 45%)`, color: config.text_color, fontFamily: config.font_family}}>
      <h1 className="text-5xl font-bold mb-4" style={{fontSize: `${config.font_size * 2.5}px`}}>{config.app_title}</h1>
      <p className="max-w-xl mx-auto opacity-80 mb-10">{config.concept_description}</p>
      
      {coachMode ? (
        <div className="glass p-6 rounded-xl max-w-4xl mx-auto text-left neon-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Tableau de bord Coach</h2>
            <button onClick={logout} className="px-4 py-2 bg-red-500/20 border border-red-500 rounded font-bold text-red-500 text-sm">Déconnexion</button>
          </div>
          <div className="p-10 border-2 border-dashed border-purple-500/30 rounded-lg text-center opacity-50">
            Ici apparaîtra la liste de tes réservations.
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <button className="btn-primary px-10 py-4 rounded-xl font-bold text-xl hover:scale-105 transition-transform">
            {config.button_text}
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto opacity-50 text-sm">
             <div className="glass p-4 rounded-lg italic">Prochains cours Mercredi 18:30</div>
             <div className="glass p-4 rounded-lg italic">Prochains cours Dimanche 18:30</div>
          </div>
        </div>
      )}

      <footer className="mt-20 opacity-30 text-xs py-10" onDoubleClick={() => setShowCoachLogin(true)}>
        © Afroboost 2026 - <span className="underline italic">Double-cliquez ici pour l'Espace Coach</span>
      </footer>
    </div>
  );
}

// Lancement de l'application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
