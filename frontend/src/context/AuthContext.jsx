import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/userSlice";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // Logged-in user details
  const [user, setUserState] = useState(null);

  // JWT Token
  const [token, setToken] = useState("");

  // Loading state
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {

    // Read token from Local Storage
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);
    }

    setLoading(false);

  }, []);

  const login = (token, user) => {

    // Save token in state
    setToken(token);

    // Save user details in state
    setUserState(user);

    // Save token in browser
    localStorage.setItem("token", token);

    // Dispatch user to Redux store
    dispatch(setUser(user));

  };

  const logout = () => {

    // Clear all states
    setUserState(null);
    setToken("");

    localStorage.removeItem("token");

  };

  return (

    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};


export const useAuth = () => {
  return useContext(AuthContext);
};