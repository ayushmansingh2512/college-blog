import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    
    try {
      const response = await api.post(
        "/auth/token",
        new URLSearchParams({
          username: email,
          password: password,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("token_type", response.data.token_type);
      setMessage("Login successful!");
      navigate("/"); // Redirect to home page after successful login
      
      // Consider using a context or state management instead of force reload
      // window.location.reload(); 
    } catch (error: any) {
      setMessage(error.response?.data?.detail || "Login failed.");
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "400px", 
      margin: "50px auto", 
      border: "1px solid #ccc", 
      borderRadius: "8px", 
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)" 
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Log In</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: "5px" }}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ 
              width: "100%", 
              padding: "8px", 
              boxSizing: "border-box", 
              borderRadius: "4px", 
              border: "1px solid #ddd" 
            }}
          />
        </div>
        
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: "5px" }}>
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ 
              width: "100%", 
              padding: "8px", 
              boxSizing: "border-box", 
              borderRadius: "4px", 
              border: "1px solid #ddd" 
            }}
          />
        </div>
        
        <button 
          type="submit" 
          style={{ 
            width: "100%", 
            padding: "10px", 
            backgroundColor: "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer" 
          }}
        >
          Log In
        </button>
      </form>
      
      {message && (
        <p style={{ 
          marginTop: "15px", 
          textAlign: "center", 
          color: message.includes("successful") ? "green" : "red" 
        }}>
          {message}
        </p>
      )}
      
      <p style={{ textAlign: "center", marginTop: "20px" }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
      
      <p style={{ textAlign: "center", marginTop: "10px" }}>
        <a href={`${import.meta.env.VITE_API_URL}/auth/google/login`}>Login with Google</a>
      </p>
    </div>
  );
};

export default Login;