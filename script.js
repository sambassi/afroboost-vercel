const { useState, useEffect } = React;

// --- 1. RÉGLAGES DE BASE ---
const translations = {
  fr: { title: "Réservation de casque", chooseSession: "Choisissez votre session", reserve: "Réserver maintenant", coachMode: "Mode Coach" },
  en: { title: "Headset Reservation", chooseSession: "Choose your session", reserve: "Reserve now", coachMode: "Coach Mode" },
  de: { title: "Kopfhörer-Reservierung", chooseSession: "Wähle deine Session", reserve: "Jetzt reservieren", coachMode: "Coach-Modus" }
};

const DEFAULT_COURSES = [
  { id: "wed", name: "Afroboost Silent – Session Cardio", weekday: 3, time: "18:30", locationName: "Rue des Vallangines 97, Neuchâtel", mapsUrl: "" },
  { id: "sun", name: "Afroboost Silent – Sunday Vibes", weekday: 0, time: "18:30", locationName: "Rue des Vallangines 97, Neuchâtel", mapsUrl: "" }
];

const DEFAULT_OFFERS = [
  { id: "single", name: "Cours à l'unité", price: 30, visible: true },
  { id: "pack10", name: "Carte 10 cours", price: 150, visible: true },
  { id: "sub1", name: "Abonnement 1 mois", price: 109, visible: true }
];

// --- 2. OUTILS (Calcul des dates, Sauvegarde) ---
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

// --- 3. L'APPLICATION ---
function App() {
  // États (Les mémoires de l'application)
  const [config, setConfig] = useState(load("af_config", {
    background_color: "#020617", gradient_color: "#3b0764", primary_color: "#d91cd2", text_color: "#ffffff",
    app_title: "Afroboost", concept_description: "Le concept Afroboost : cardio + danse afrobeat + casques audio immersifs. Un entraînement fun, énergétique et accessible à tous.",
    choose_offer_text: "Choisissez votre offre", user_info_text: "Vos informations", button_text: "Réserver maintenant"
  }));
  const [courses, setCourses] = useState(load("af_courses", DEFAULT_COURSES));
  const [offers, setOffers] = useState(load("af_offers", DEFAULT_OFFERS));
  const [reservations, setReservations] = useState(load("af_reservations", []));
  const [users, setUsers] = useState(load("af_users", []));
  const [discountCodes, setDiscountCodes] = useState(load("afroboost_discountCodes", []));
  
  const [coachMode, setCoachMode] = useState(localStorage.getItem("isCoachLoggedIn") === "true");
  const [coachTab, setCoachTab] = useState("reservations");
  const [showCoachLogin, setShowCoachLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Sauvegarde automatique quand on change quelque chose
  useEffect(() => { save("af_config", config); save("af_reservations", reservations); }, [config, reservations]);

  // Gestion de la connexion Coach
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === "coach@afroboost.com" && loginPassword === "Afroboost2026") {
      localStorage.setItem("isCoachLoggedIn", "true");
      setCoachMode(true);
      setShowCoachLogin(false);
    } else { alert("Accès refusé : Identifiants incorrects"); }
  };

  // --- RENDU : ESPACE COACH ---
  if (coachMode) {
    return (
      <div className="min-h-screen p-6" style={{background: config.background_color, color: config.text_color}}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Tableau de Bord Coach</h1>
            <button onClick={() => { localStorage.removeItem("isCoachLoggedIn"); setCoachMode(false); }} className="px-4 py-2 bg-red-600 rounded text-sm font-bold">Déconnexion</button>
          </div>
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {["reservations", "courses", "offers", "codes"].map(tab => (
              <button key={tab} onClick={() => setCoachTab(tab)} className={`px-4 py-2 rounded-lg glass ${coachTab === tab ? 'neon-border' : ''}`}>
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="glass p-6 rounded-xl">
            {coachTab === "reservations" && (
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/20"><th className="p-2">Code</th><th className="p-2">Client</th><th className="p-2">Session</th><th className="p-2">Total</th></tr></thead>
                <tbody>{reservations.map((r, i) => <tr key={i} className="border-b border-white/10"><td className="p-2 font-bold text-pink-500">{r.reservationCode}</td><td className="p-2">{r.userName}</td><td className="p-2">{r.courseName}</td><td className="p-2">CHF {r.totalPrice}</td></tr>)}</tbody>
              </table>
            )}
            {coachTab !== "reservations" && <p className="text-center opacity-50 py-10">Gestion {coachTab} active.</p>}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDU : FORMULAIRE DE CONNEXION ---
  if (showCoachLogin) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="glass rounded-xl p-8 max-w-md w-full neon-border">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Connexion Coach</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 rounded glass text-white" required />
            <input type="password" placeholder="Mot de passe" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-3 rounded glass text-white" required />
            <button type="submit" className="btn-primary w-full py-3 rounded-lg font-bold">Entrer</button>
            <button type="button" onClick={() => setShowCoachLogin(false)} className="w-full text-sm opacity-50">Annuler</button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDU : SITE PUBLIC ---
  return (
    <div className="min-h-screen p-6 text-center" style={{background: `radial-gradient(circle at top, ${config.gradient_color} 0%, ${config.background_color} 45%)`, color: config.text_color}}>
      <h1 className="text-5xl font-bold mb-4 mt-10">{config.app_title}</h1>
      <p className="max-w-xl mx-auto opacity-80 mb-12 text-lg">{config.concept_description}</p>
      
      <div className="max-w-3xl mx-auto space-y-10">
        <h2 className="text-3xl font-bold">1. Choisissez votre session</h2>
        {courses.map(course => (
          <div key={course.id} className="glass p-6 rounded-2xl text-left border border-white/10 course-card">
            <h3 className="font-bold text-xl mb-4">{course.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {getNextOccurrences(course.weekday).map((date, i) => {
                const isSel = selectedSession === `${course.id}-${date.getTime()}`;
                return (
                  <button key={i} onClick={()=>{setSelectedCourse(course); setSelectedDate(date); setSelectedSession(`${course.id}-${date.getTime()}`);}} className={`p-3 text-xs rounded-xl glass transition-all ${isSel?'neon-border bg-purple-500/30 font-bold':''}`}>
                    {formatDate(date, course.time)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {selectedDate && (
          <div className="pt-10 space-y-10 animate-fade-in">
            <h2 className="text-3xl font-bold">2. Choisissez votre offre</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {offers.map(o=>(<div key={o.id} onClick={()=>setSelectedOffer(o)} className={`p-6 glass rounded-xl cursor-pointer transition-all ${selectedOffer?.id===o.id?'neon-border bg-purple-500/20 scale-105':''}`}>{o.name}<br/><span className="text-2xl font-bold text-pink-500">CHF {o.price}</span></div>))}
            </div>
          </div>
        )}

        {selectedOffer && (
          <div className="pt-10 glass p-8 rounded-2xl border border-white/10">
             <h2 className="text-3xl font-bold mb-6">3. Vos informations</h2>
             <input type="text" placeholder="Nom complet" className="w-full p-4 rounded glass mb-4" onChange={e=>setUserName(e.target.value)} />
             <input type="email" placeholder="Email" className="w-full p-4 rounded glass mb-6" onChange={e=>setUserEmail(e.target.value)} />
             <button className="btn-primary w-full py-5 rounded-2xl font-bold text-xl" onClick={()=>alert("Redirection vers le paiement...")}>
               Payer CHF {selectedOffer.price} et Réserver
             </button>
          </div>
        )}
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
