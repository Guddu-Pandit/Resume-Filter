import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(true); // Always authenticated
  // const [isAuth, setIsAuth] = useState(
  //   !!localStorage.getItem("token")
  // );

  const [user, setUser] = useState({
    id: "659d8f8e5f1a2b3c4d5e6f7a",
    name: "Guest User",
    email: "guest@example.com"
  });
  // const [user, setUser] = useState(
  //   JSON.parse(localStorage.getItem("user"))
  // );

  const loginUser = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuth(true);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuth, user, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
