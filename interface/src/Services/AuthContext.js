import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { verifyToken, testAuth } from "./api";

const AuthContext = createContext({
  user: null,
  status: "loading",
  sessionReady: false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setStatus("authed");
        try {
          const idToken = await firebaseUser.getIdToken();
          await verifyToken(idToken);
          const testRes = await testAuth();
          if (testRes && testRes.uid) {
            setSessionReady(true);
          } else {
            setSessionReady(false);
          }
        } catch (e) {
          console.error("Session establishment failed:", e);
          setSessionReady(false);
        }
      } else {
        setUser(null);
        setStatus("guest");
        setSessionReady(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, status, sessionReady }),
    [user, status, sessionReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
