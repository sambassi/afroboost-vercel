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

function App() {
  const [lang, setLang] = useState("fr");
  const [config, setConfig] = useState(load("af_config", defaultConfig));
  const [courses, setCourses] = useState(load("af_courses", DEFAULT_COURSES));
  const [offers, setOffers] = useState(load("af_offers", []));
  const [reservations, setReservations] = useState(load("af_reservations", []));
  const [coachMode, setCoachMode] = useState(localStorage.getItem("isCoachLoggedIn") === "true");
  const [coachTab, setCoachTab] = useState("reservations");
  const [showCoachLogin, setShowCoachLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => { save("af_config", config); }, [config]);
  useEffect(() => { save("af_courses", courses); }, [courses]);
  useEffect(() => { save("af_reservations", reservations); }, [reservations]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === "coach@afroboost.com" && loginPassword === "Afroboost2026") {
      localStorage.setItem("isCoachLoggedIn", "true");
      setCoachMode(true);
      setShowCoachLogin(false);
    } else { setLoginError("Erreur de connexion."); }
  };

  if (showCoachLogin) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="glass rounded-xl p-8 max-w-md w-full neon-border">
          <h2 className="text-xl font-bold mb-6 text-white text-center">Espace Coach</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 mb-4 rounded glass text-white" required />
            <input type="password" placeholder="Mot de passe" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-3 mb-4 rounded glass text-white" required />
            <button type="submit" className="btn-primary w-full py-3 rounded-lg font-bold">Connexion</button>
            <button type="button" onClick={() => setShowCoachLogin(false)} className="w-full mt-4 text-slate-400 text-sm">Annuler</button>
          </form>
        </div>
      </div>
    );
  }

  if (coachMode) {
    return (
      <div className="min-h-screen p-6" style={{background: config.background_color, color: config.text_color}}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Mode Coach</h1>
            <button onClick={() => { localStorage.removeItem("isCoachLoggedIn"); setCoachMode(false); }} className="px-4 py-2 bg-red-500 rounded text-sm font-bold">Quitter</button>
          </div>
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {["reservations", "courses", "offers", "config"].map(tab => (
              <button key={tab} onClick={() => setCoachTab(tab)} className={`px-4 py-2 rounded-lg glass ${coachTab === tab ? 'neon-border' : ''}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="glass p-6 rounded-xl">
            {coachTab === "reservations" && (
              <div>
                <h3 className="text-xl font-bold mb-4">Liste des réservations</h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="border-b border-white/20">
                       <tr><th className="p-2">Client</th><th className="p-2">Cours</th><th className="p-2">Date</th></tr>
                     </thead>
                     <tbody>
                       {reservations.map((res, i) => (
                         <tr key={i} className="border-b border-white/10">
                           <td className="p-2">{res.name}</td><td className="p-2">{res.course}</td><td className="p-2">{res.date}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                   {reservations.length === 0 && <p className="py-10 text-center opacity-50">Aucune réservation pour le moment.</p>}
                </div>
              </div>
            )}
            {coachTab === "courses" && <p>Gestion des cours (Bientôt disponible)</p>}
            {coachTab === "offers" && <p>Gestion des offres (Bientôt disponible)</p>}
            {coachTab === "config" && <p>Réglages du design (Bientôt disponible)</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-center" style={{background: `radial-gradient(circle at top, ${config.gradient_color} 0%, ${config.background_color} 45%)`, color: config.text_color}}>
      <h1 className="text-5xl font-bold mb-4 mt-10">{config.app_title}</h1>
      <p className="max-w-xl mx-auto opacity-80 mb-10">{config.concept_description}</p>
      
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold mb-4">Prochaines Sessions</h2>
        {courses.map(course => (
          <div key={course.id} className="glass p-5 rounded-xl text-left border border-white/10">
            <h3 className="font-bold text-lg mb-3">{course.name}</h3>
            <div className="grid grid-cols-2 gap-2">
              {getNextOccurrences(course.weekday).map((date, i) => (
                <button key={i} className="p-2 text-xs rounded-lg glass hover:neon-border">
                  {formatDate(date, course.time)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-40 opacity-30 text-xs py-10">
        <span onDoubleClick={() => setShowCoachLogin(true)} style={{cursor: 'pointer'}}>©</span> Afroboost 2026
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
