import { createContext, useState } from "react";
import { setToken, removeToken } from "../utils/token";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));

  const loginUser = (token) => {
    setToken(token);
    setIsAuth(true);
  };

  const logoutUser = () => {
    removeToken();
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{ isAuth, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
