import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import "./LogSign.css";
import "../App.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true); // inizialmente mostra login

  // Funzioni per fare lo switch
  const switchToSignup = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <div className="auth-page">
      {isLogin ? (
        <Login switchToSignup={switchToSignup} />
      ) : (
        <Signup switchToLogin={switchToLogin} />
      )}
    </div>
  );
};

export default AuthPage;
