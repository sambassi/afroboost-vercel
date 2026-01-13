const { useState, useEffect } = React;

// --- CONFIGURATION PAR DÉFAUT ---
const translations = {
  fr: { title: "Réservation de casque", chooseSession: "Choisissez votre session", reserve: "Réserver maintenant", coachMode: "Mode Coach" },
  en: { title: "Headset Reservation", chooseSession: "Choose your session", reserve: "Reserve now", coachMode: "Coach Mode" },
  de: { title: "Kopfhörer-Reservierung", chooseSession: "Wähle deine Session", reserve: "Jetzt reservieren", coachMode: "Coach-Modus" }
};

const defaultConfig = {
  background_color: "#020617", gradient_color: "#3b0764", primary_color: "#d91cd2", secondary_color: "#8b5cf6",
  text_color: "#ffffff", font_family: "system-ui", font_size: 16, app_title: "Afroboost",
  app_subtitle: "Réservation de casque", concept_description: "Le concept Afroboost : cardio + danse afrobeat + casques audio immersifs. Un entraînement fun, énergétique et accessible à tous.",
  choose_session_text: "Choisissez votre session", choose_offer_text: "Choisissez votre offre",
  user_info_text: "Vos informations", button_text: "Réserver maintenant"
};

const DEFAULT_COURSES = [
  { id: "wed", name: "Afroboost Silent – Session Cardio", weekday: 3, time: "18:30", locationName: "Rue des Vallangines 97, Neuchâtel", mapsUrl: "" },
  { id: "sun", name: "Afroboost Silent – Sunday Vibes", weekday: 0, time: "18:30", locationName: "Rue des Vallangines 97, Neuchâtel", mapsUrl: "" }
];

const DEFAULT_OFFERS = [
  { id: "single", name: "Cours à l'unité", price: 30, visible: true, thumbnail: "", description: "" },
  { id: "pack10", name: "Carte 10 cours", price: 150, visible: true, thumbnail: "", description: "" },
  { id: "sub1", name: "Abonnement 1 mois", price: 109, visible: true, thumbnail: "", description: "" }
];

// --- UTILITAIRES ---
const load = (key, fallback) => {
  const raw = localStorage.getItem(key);
  try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
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

// --- COMPOSANT IMAGE ---
const ImageWithDimensions = ({ imageUrl, alt, config }) => {
  if (!imageUrl) return null;
  return <img src={imageUrl} alt={alt} className="image-preview" style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />;
};

function App() {
  const [lang, setLang] = useState("fr");
  const [config, setConfig] = useState(load("af_config", defaultConfig));
  const [courses, setCourses] = useState(load("af_courses", DEFAULT_COURSES));
  const [offers, setOffers] = useState(load("af_offers", DEFAULT_OFFERS));
  const [reservations, setReservations] = useState(load("af_reservations", []));
  const [users, setUsers] = useState(load("af_users", []));
  const [discountCodes, setDiscountCodes] = useState(load("afroboost_discountCodes", []));
  const [paymentLinks, setPaymentLinks] = useState(load("af_payment_links", {stripe:"", paypal:"", twint:"", coachWhatsapp:""}));
  const [concept, setConcept] = useState(load("af_concept", {description: defaultConfig.concept_description, heroImageUrl: "", heroVideoUrl: ""}));

  const [coachMode, setCoachMode] = useState(localStorage.getItem("isCoachLoggedIn") === "true");
  const [coachTab, setCoachTab] = useState("reservations");
  const [showCoachLogin, setShowCoachLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userWhatsapp, setUserWhatsapp] = useState("");

  useEffect(() => { save("af_config", config); }, [config]);
  useEffect(() => { save("af_courses", courses); }, [courses]);
  useEffect(() => { save("af_offers", offers); }, [offers]);
  useEffect(() => { save("af_reservations", reservations); }, [reservations]);
  useEffect(() => { save("af_users", users); }, [users]);
  useEffect(() => { save("afroboost_discountCodes", discountCodes); }, [discountCodes]);
  useEffect(() => { save("af_payment_links", paymentLinks); }, [paymentLinks]);
  useEffect(() => { save("af_concept", concept); }, [concept]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === "coach@afroboost.com" && loginPassword === "Afroboost2026") {
      localStorage.setItem("isCoachLoggedIn", "true");
      setCoachMode(true);
      setShowCoachLogin(false);
      setLoginError("");
    } else { setLoginError("Email ou mot de passe incorrect."); }
  };

  const handleForgotPw = () => {
    window.location.href = `mailto:coach@afroboost.com?subject=Mot de passe oublié&body=Demande de réinitialisation.`;
  };

  const exportUsersCSV = () => {
    const rows = [["Nom", "Email", "Cours", "Date"], ...reservations.map(r => [r.userName, r.userEmail, r.courseName, r.datetime])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "reservations.csv"; a.click();
  };

  // --- RENDU DU MODE COACH ---
  if (coachMode) {
    return (
      <div className="min-h-screen p-6" style={{background: config.background_color, color: config.text_color, fontFamily: config.font_family}}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Mode Coach</h1>
            <button onClick={() => { localStorage.removeItem("isCoachLoggedIn"); setCoachMode(false); }} className="px-4 py-2 bg-red-500 rounded font-bold text-sm">Quitter</button>
          </div>
          <div className="flex gap-2 mb-6 flex-wrap">
            {["reservations", "concept", "courses", "offers", "payments", "codes"].map(tab => (
              <button key={tab} onClick={() => setCoachTab(tab)} className={`px-4 py-2 rounded-lg glass ${coachTab === tab ? 'neon-border' : ''}`}>
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="glass p-6 rounded-xl">
            {coachTab === "reservations" && (
              <div>
                <div className="flex justify-between mb-4"><h2>Réservations</h2><button onClick={exportUsersCSV} className="text-xs underline">Exporter CSV</button></div>
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-white/20"><th className="p-2">Client</th><th className="p-2">Cours</th><th className="p-2">Date</th></tr></thead>
                  <tbody>{reservations.map((r, i) => <tr key={i} className="border-b border-white/10"><td className="p-2">{r.userName}</td><td className="p-2">{r.courseName}</td><td className="p-2">{r.datetime}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            {coachTab === "concept" && <div><label className="block mb-2">Description Concept</label><textarea className="w-full glass p-3 rounded" value={concept.description} onChange={e => setConcept({...concept, description: e.target.value})} /></div>}
            {coachTab === "courses" && <p className="opacity-50">Ici vous pouvez modifier les horaires et lieux.</p>}
            {coachTab === "offers" && <p className="opacity-50">Ici vous pouvez ajuster vos prix et services.</p>}
            {coachTab === "payments" && <p className="opacity-50">Configurez vos liens Stripe, Paypal et Twint.</p>}
            {coachTab === "codes" && <p className="opacity-50">Générez des codes promo ou importez des listes.</p>}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDU DU SITE PUBLIC ---
  if (showCoachLogin) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="glass rounded-xl p-8 max-w-md w-full neon-border">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Espace Coach</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 rounded glass text-white" required />
            <input type="password" placeholder="Mot de passe" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-3 rounded glass text-white" required />
            <button type="submit" className="btn-primary w-full py-3 rounded-lg font-bold">Connexion</button>
            <button type="button" onClick={handleForgotPw} className="w-full text-xs opacity-50 underline">Mot de passe oublié ?</button>
            <button type="button" onClick={() => setShowCoachLogin(false)} className="w-full text-sm opacity-80">Annuler</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-center" style={{background: `radial-gradient(circle at top, ${config.gradient_color} 0%, ${config.background_color} 45%)`, color: config.text_color, fontFamily: config.font_family}}>
      <h1 className="text-5xl font-bold mb-4 mt-10">{config.app_title}</h1>
      <p className="max-w-xl mx-auto opacity-80 mb-10 text-lg">{concept.description}</p>
      
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold">Prochaines Sessions</h2>
        {courses.map(course => (
          <div key={course.id} className="glass p-6 rounded-2xl text-left border border-white/10 course-card">
            <h3 className="font-bold text-xl mb-4">{course.name}</h3>
            <p className="text-sm opacity-70 mb-4">📍 {course.locationName}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {getNextOccurrences(course.weekday).map((date, i) => (
                <button key={i} className="p-3 text-xs rounded-xl glass hover:neon-border transition-all">
                  {formatDate(date, course.time)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-40 opacity-30 text-xs py-10">
        <span 
          onDoubleClick={() => {
            if (localStorage.getItem("isCoachLoggedIn") === "true") setCoachMode(true);
            else setShowCoachLogin(true);
          }} 
          style={{cursor: 'pointer', padding: '10px'}}
        >
          ©
        </span> Afroboost 2026
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
