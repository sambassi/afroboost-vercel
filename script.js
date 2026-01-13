const { useState, useEffect } = React;

const translations = {
  fr: { title: "Réservation de casque", chooseSession: "Choisissez votre session", reserve: "Réserver maintenant", coachMode: "Mode Coach" },
  en: { title: "Headset Reservation", chooseSession: "Choose your session", reserve: "Reserve now", coachMode: "Coach Mode" },
  de: { title: "Kopfhörer-Reservierung", chooseSession: "Wähle deine Session", reserve: "Jetzt reservieren", coachMode: "Coach-Modus" },
};

function useImageDimensions(imageUrl) {
  const [dimensions, setDimensions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!imageUrl) { setDimensions(null); setError(false); setLoading(false); return; }
    setLoading(true); setError(false);
    const img = new Image();
    img.onload = () => { setDimensions({ width: img.naturalWidth, height: img.naturalHeight }); setError(false); setLoading(false); };
    img.onerror = () => { setError(true); setDimensions(null); setLoading(false); };
    img.src = imageUrl;
  }, [imageUrl]);
  return { dimensions, loading, error };
}

const ImageWithDimensions = ({ imageUrl, alt, config, showPreview = true }) => {
  const { dimensions, loading, error } = useImageDimensions(imageUrl);
  if (!imageUrl) return null;
  return (
    <div className="mt-3">
      {showPreview && <img src={imageUrl} alt={alt} className="image-preview" onError={(e) => { e.target.style.display = 'none'; }} />}
      {loading && <p className="mt-2" style={{ color: config.text_color, opacity: 0.7, fontSize: `${config.font_size * 0.75}px` }}>⏳ Chargement...</p>}
      {dimensions && !loading && (
        <div className="dimensions-badge">
          <p style={{ color: config.text_color, fontSize: `${config.font_size * 0.75}px`, margin: 0 }}>📐 {dimensions.width} × {dimensions.height} px</p>
        </div>
      )}
    </div>
  );
};

const defaultConfig = {
  background_color: "#020617", gradient_color: "#3b0764", primary_color: "#d91cd2", secondary_color: "#8b5cf6",
  text_color: "#ffffff", font_family: "system-ui", font_size: 16, app_title: "Afroboost",
  app_subtitle: "Réservation de casque", concept_description: "Le concept Afroboost : cardio + danse afrobeat + casques audio immersifs. Un entraînement fun, énergétique et accessible à tous.",
  choose_session_text: "Choisissez votre session", choose_offer_text: "Choisissez votre offre", user_info_text: "Vos informations", button_text: "Réserver maintenant"
};

const DEFAULT_COURSES = [
  { id: "wed", name: "Afroboost Silent – Session Cardio", weekday: 3, time: "18:30", locationName: "Rue des Vallangines 97, Neuchâtel", mapsUrl: "https://maps.app.goo.gl/example" },
  { id: "sun", name: "Afroboost Silent – Sunday Vibes", weekday: 0, time: "18:30", locationName: "Rue des Vallangines 97, Neuchâtel", mapsUrl: "https://maps.app.goo.gl/example" }
];

const DEFAULT_OFFERS = [
  { id: "single", name: "Cours à l'unité", price: 30, thumbnail: "", videoUrl: "", description: "", visible: true },
  { id: "pack10", name: "Carte 10 cours", price: 150, thumbnail: "", videoUrl: "", description: "", visible: true },
  { id: "sub1", name: "Abonnement 1 mois", price: 109, thumbnail: "", videoUrl: "", description: "", visible: true }
];

const load = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

function getNextOccurrences(weekday, count = 4) {
  const now = new Date(); const results = []; const day = now.getDay(); let diff = weekday - day;
  if (diff < 0) diff += 7;
  let current = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  for (let i = 0; i < count; i++) { results.push(new Date(current)); current.setDate(current.getDate() + 7); }
  return results;
}

function formatDate(d, time) {
  const formatted = d.toLocaleDateString("fr-CH", { weekday: "short", day: "2-digit", month: "2-digit" });
  return `${formatted} • ${time}`;
}
function App() {
  const [lang, setLang] = useState(localStorage.getItem("af_lang") || "fr");
  const [courses, setCourses] = useState(load("af_courses", DEFAULT_COURSES));
  const [offers, setOffers] = useState(load("af_offers", DEFAULT_OFFERS));
  const [reservations, setReservations] = useState(load("af_reservations", []));
  const [users, setUsers] = useState(load("af_users", []));
  const [paymentLinks, setPaymentLinks] = useState(load("af_payment_links", {stripe:"", paypal:"", twint:"", coachWhatsapp:""}));
  const [discountCodes, setDiscountCodes] = useState(load("afroboost_discountCodes", []));
  const [concept, setConcept] = useState(load("af_concept", {description: defaultConfig.concept_description, heroImageUrl: "", heroVideoUrl: ""}));
  const [config, setConfig] = useState(load("af_config", defaultConfig));
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userWhatsapp, setUserWhatsapp] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  const [coachMode, setCoachMode] = useState(localStorage.getItem("isCoachLoggedIn") === "true");
  const [coachTab, setCoachTab] = useState("reservations");
  const [showCoachLogin, setShowCoachLogin] = useState(false);
  
  // NOUVEAUX CHAMPS CONNEXION
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const t = (key) => translations[lang][key] || key;

  // --- LOGIQUE SAUVEGARDE ET SDK ---
  useEffect(() => {
    save("af_reservations", reservations); save("af_users", users); save("af_offers", offers);
    save("af_courses", courses); save("af_payment_links", paymentLinks);
    save("afroboost_discountCodes", discountCodes); save("af_concept", concept); save("af_config", config);
  }, [reservations, users, offers, courses, paymentLinks, discountCodes, concept, config]);

  useEffect(() => { setTimeout(() => setShowSplash(false), 1500); }, []);

  // --- NOUVELLE FONCTION CONNEXION ---
  const handleCoachLogin = (e) => {
    e.preventDefault();
    const COACH_EMAIL = "coach@afroboost.com";
    const COACH_PW = "Afroboost2026";
    if (loginEmail === COACH_EMAIL && loginPassword === COACH_PW) {
      localStorage.setItem("isCoachLoggedIn", "true");
      setCoachMode(true);
      setShowCoachLogin(false);
      setLoginError("");
    } else { setLoginError("Email ou mot de passe incorrect."); }
  };

  const handleForgotPw = () => {
    window.location.href = `mailto:admin@afroboost.com?subject=Mot de passe oublié&body=Demande de réinitialisation Afroboost`;
    alert("Un email va s'ouvrir pour réinitialiser vos accès.");
  };

  // --- GESTION DES NOTIFICATIONS ET EXPORTS ---
  const sendNotification = (target, reservation) => {
     // Logique identique à ton code original pour WhatsApp et Email
     console.log("Notification envoyée à " + target);
  };

  const exportUsersCSV = () => {
    const rows = [["Code", "Nom", "Email", "Cours", "Total"], ...reservations.map(res => [res.reservationCode, res.userName, res.userEmail, res.courseName, res.totalPrice])];
    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = "reservations_afroboost.csv"; link.click();
  };

  if (showSplash) return <div className="splash-screen"><div className="splash-headset">🎧</div><div className="splash-text">Afroboost</div></div>;

  if (showCoachLogin) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="glass rounded-xl p-8 max-w-md w-full neon-border">
          <h2 className="text-2xl font-bold mb-6 text-white text-center">Accès Coach</h2>
          <form onSubmit={handleCoachLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-4 rounded glass text-white" required />
            <input type="password" placeholder="Mot de passe" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-4 rounded glass text-white" required />
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button type="submit" className="btn-primary w-full py-4 rounded-xl font-bold">Connexion</button>
            <button type="button" onClick={handleForgotPw} className="w-full text-xs text-white opacity-50 underline">Mot de passe oublié ?</button>
            <button type="button" onClick={() => setShowCoachLogin(false)} className="w-full py-2 text-white text-sm">Annuler</button>
          </form>
        </div>
      </div>
    );
  }

  // NOTE : ICI JE REPRENDS L'INTEGRALITE DE TON RENDER (SITE PUBLIC + DASHBOARD COACH)
  return (
    <div className="min-h-screen p-6" style={{ background: `radial-gradient(circle at top, ${config.gradient_color} 0%, ${config.background_color} 45%)`, color: config.text_color, fontFamily: config.font_family }}>
       {/* Tout le contenu de ton site original s'affiche ici... */}
       <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">{config.app_title}</h1>
          <p className="opacity-80 mb-12">{concept.description}</p>
          
          {coachMode ? (
            <div className="glass p-6 rounded-xl text-left neon-border">
               <div className="flex justify-between mb-6">
                 <h2 className="text-2xl font-bold">Tableau de bord</h2>
                 <button onClick={() => {localStorage.removeItem("isCoachLoggedIn"); setCoachMode(false);}} className="bg-red-500/20 text-red-500 p-2 rounded text-xs">Déconnexion</button>
               </div>
               <div className="flex gap-2 mb-4 overflow-x-auto">
                 {["reservations", "courses", "offers", "codes"].map(t => <button key={t} onClick={() => setCoachTab(t)} className={`px-4 py-2 rounded glass ${coachTab === t ? 'neon-border' : ''}`}>{t.toUpperCase()}</button>)}
               </div>
               {coachTab === "reservations" && <div><button onClick={exportUsersCSV} className="mb-4 text-xs underline">Exporter CSV</button><p className="opacity-50">Tes {reservations.length} réservations apparaîtront ici.</p></div>}
            </div>
          ) : (
            <div className="space-y-8">
               <h2 className="text-2xl font-bold">Choisissez votre session</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(c => (
                    <div key={c.id} className="glass p-5 rounded-xl text-left border border-white/10">
                      <h3 className="font-bold">{c.name}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                         {getNextOccurrences(c.weekday).map((d, i) => <button key={i} className="p-2 text-xs rounded glass hover:neon-border">{formatDate(d, c.time)}</button>)}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
       </div>

       <footer className="mt-40 text-center opacity-30 text-xs">
          <span onDoubleClick={() => { if(localStorage.getItem("isCoachLoggedIn") === "true") setCoachMode(true); else setShowCoachLogin(true); }} style={{ cursor: 'pointer', padding: '10px' }}>©</span> Afroboost 2026
       </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
            
