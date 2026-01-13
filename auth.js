/**
 * CoachAuth
 * ----------
 * Logique d'authentification "coach" isolée du reste de l'app (réservations, UI, etc.).
 *
 * Contrainte actuelle (comportement existant) :
 * - La "connexion coach" est validée en comparant un code saisi avec un code stocké en localStorage.
 * - Le code et sa date d'expiration sont stockés dans:
 *   - coachLoginCode
 *   - coachLoginExpires (timestamp ms)
 * - Le statut de connexion est stocké dans:
 *   - isCoachLoggedIn = "true"
 *
 * FUTUR — Mot de passe oublié (Firebase / Supabase) :
 * - L'UI pourra ajouter un lien/bouton "Mot de passe oublié ?" près du champ email.
 * - Implémentation typique:
 *   - Firebase: sendPasswordResetEmail(auth, email)
 *   - Supabase: supabase.auth.resetPasswordForEmail(email, { redirectTo })
 * - Le flux devra gérer:
 *   - validation d'email
 *   - messages de succès/erreur
 *   - redirection post-reset (deep link) et mise à jour du mot de passe
 * Ici, on prépare l'emplacement logique (méthodes / TODO) sans changer le design.
 */

(function attachCoachAuth(global) {
  const STORAGE_KEYS = Object.freeze({
    loginCode: "coachLoginCode",
    loginExpires: "coachLoginExpires",
    isLoggedIn: "isCoachLoggedIn",
    // Réservé pour une future protection anti-bruteforce (non activée pour garder le comportement actuel)
    // attempts: "coachLoginAttempts",
    // lockUntil: "coachLockUntil",
  });

  function safeGetItem(key) {
    try {
      return global?.localStorage?.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      global?.localStorage?.setItem(key, value);
    } catch {
      // no-op
    }
  }

  function safeRemoveItem(key) {
    try {
      global?.localStorage?.removeItem(key);
    } catch {
      // no-op
    }
  }

  function getPendingLoginCode() {
    const savedCode = safeGetItem(STORAGE_KEYS.loginCode);
    const expiresRaw = safeGetItem(STORAGE_KEYS.loginExpires) || "0";
    const expiresAt = Number.parseInt(expiresRaw, 10) || 0;
    return { savedCode, expiresAt };
  }

  function clearPendingLoginCode() {
    safeRemoveItem(STORAGE_KEYS.loginCode);
    safeRemoveItem(STORAGE_KEYS.loginExpires);
  }

  function markLoggedIn() {
    safeSetItem(STORAGE_KEYS.isLoggedIn, "true");
    clearPendingLoginCode();
  }

  function logout() {
    safeRemoveItem(STORAGE_KEYS.isLoggedIn);
  }

  function isLoggedIn() {
    return safeGetItem(STORAGE_KEYS.isLoggedIn) === "true";
  }

  /**
   * Valide le code saisi par rapport au code stocké localement.
   * Retourne un objet { ok, error } pour laisser l'UI gérer l'affichage.
   */
  function validateLoginCode(inputCode) {
    const now = Date.now();
    const { savedCode, expiresAt } = getPendingLoginCode();

    if (!savedCode || !expiresAt) {
      return { ok: false, error: "Aucun code trouvé. Demande un nouveau code." };
    }

    if (now > expiresAt) {
      clearPendingLoginCode();
      return { ok: false, error: "Le code a expiré. Demande un nouveau code." };
    }

    if (String(inputCode || "") !== String(savedCode)) {
      return { ok: false, error: "Code incorrect" };
    }

    return { ok: true, error: "" };
  }

  /**
   * FUTUR — génération / envoi de code (email, SMS, etc.)
   * - Firebase: custom token / email link / cloud function
   * - Supabase: magic link / OTP
   * L'UI pourra appeler setPendingLoginCode(code, ttlMs) après réception du code.
   */
  function setPendingLoginCode(code, ttlMs) {
    const ttl = Number.isFinite(ttlMs) ? ttlMs : 10 * 60 * 1000; // 10 minutes par défaut
    safeSetItem(STORAGE_KEYS.loginCode, String(code));
    safeSetItem(STORAGE_KEYS.loginExpires, String(Date.now() + ttl));
  }

  /**
   * FUTUR — Mot de passe oublié (placeholder logique).
   * Cette fonction n'est pas branchée à l'UI pour l'instant afin de ne pas modifier le design.
   */
  async function requestPasswordReset(email) {
    // TODO(Firebase):
    //   import { getAuth, sendPasswordResetEmail } from "firebase/auth";
    //   const auth = getAuth();
    //   await sendPasswordResetEmail(auth, email);
    //
    // TODO(Supabase):
    //   const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: "<URL>/reset" });
    //   if (error) throw error;
    //
    // Note: garder un message générique côté UI ("Si un compte existe...") pour éviter l'énumération d'emails.
    throw new Error("Not implemented");
  }

  global.CoachAuth = Object.freeze({
    STORAGE_KEYS,
    isLoggedIn,
    validateLoginCode,
    markLoggedIn,
    logout,
    // Exposé pour intégrations futures (sans impacter l'existant)
    setPendingLoginCode,
    requestPasswordReset,
  });
})(window);

