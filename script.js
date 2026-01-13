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
  button_text: "Réserver maintenant"
};

const load = (key, fallback) => {
  const raw = localStorage.getItem(key);
  try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
};

// --- APPLICATION PRINCIPALE ---
function App() {
  const [config, setConfig] = useState(load("af_config", defaultConfig));
  const [coachMode, setCoachMode] = useState(localStorage.getItem("isCoachLoggedIn") === "true");
  const [showCoachLogin, setShowCoachLogin] = useState(false);
  
  // Champs pour la connexion sécurisée
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Fonction de connexion
  const handleLogin = (e) => {
    e.preventDefault();
    // Tes identifiants Coach
    if (loginEmail === "coach@afroboost.com" && loginPassword === "Afroboost2026") {
      localStorage.setItem("isCoachLoggedIn", "true");
      setCoachMode(true);
      setShowCoachLogin(false);
      setLoginError("");
    } else {
      setLoginError("Email ou mot de passe incorrect.");
    }
  };

  // Fonction Mot de passe oublié
  const handleForgotPw = () => {
    const subject = encodeURIComponent("Réinitialisation de mon accès Coach");
    const body = encodeURIComponent("Bonjour, j'ai oublié mon mot de passe pour Afroboost.");
    window.location.href = `mailto:admin@afroboost.com?subject=${subject}&body=${body}`;
    alert("Ton application d'email va s'ouvrir pour envoyer une demande.");
  };

  if (showCoachLogin) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-6" style={{background: config.background_color}}>
        <div className="glass rounded-xl p-8 max-w-md w-full neon-border">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{color: config.text_color}}>Accès Coach</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 mb-4 rounded glass text-white border-none" required />
            <input type="password" placeholder="Mot de passe" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-3 mb-4 rounded glass text-white border-none" required />
            {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
            <button type="submit" className="btn-primary w-full py-3 rounded-lg font-bold mb-4">Se connecter</button>
            <button type="button" onClick={handleForgotPw} className="w-full text-xs opacity-60 underline mb-4" style={{color: config.text_color}}>Mot de passe oublié ?</button>
            <button type="button" onClick={() => setShowCoachLogin(false)} className="w-full py-2 rounded glass text-sm" style={{color: config.text_color}}>Retour</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-center" style={{background: `radial-gradient(circle at top, ${config.gradient_color} 0%, ${config.background_color} 45%)`, color: config.text_color}}>
      <h1 className="text-5xl font-bold mb-4 mt-10">{config.app_title}</h1>
      <p className="max-w-xl mx-auto opacity-80 mb-10">{config.concept_description}</p>
      
      {coachMode ? (
        <div className="glass p-6 rounded-xl max-w-2xl mx-auto text-left neon-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Mode Coach Activé ✅</h2>
            <button onClick={() => { localStorage.removeItem("isCoachLoggedIn"); setCoachMode(false); }} className="text-xs p-2 bg-red-500/20 rounded text-red-500">Quitter</button>
          </div>
          <p className="opacity-70">Bienvenue coach ! Tes outils de gestion s'afficheront ici bientôt.</p>
        </div>
      ) : (
        <button className="btn-primary px-10 py-4 rounded-xl font-bold text-xl hover:scale-105 transition-all">
          {config.button_text}
        </button>
      )}

      <footer className="mt-40 opacity-30 text-xs py-10" onDoubleClick={() => setShowCoachLogin(true)}>
        © Afroboost 2026 - <span className="underline italic">Double-cliquez ici pour l'Espace Coach</span>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
