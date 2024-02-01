import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

function App() {
  return (
    <Router>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/chatbot">Chatbot</Link>
          </li>
          <li>
            <Link to="/article-generator">Générateur d'Articles</Link>
          </li>
          <li>
            <Link to="/articles">Articles</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/article-generator" element={<ArticleGenerator />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

function Home() {
  return <h2>Accueil</h2>;
}

function Chatbot() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const sendMessage = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_message: message }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
    }
  };

  return (
    <div>
      <h2>Chatbot</h2>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Envoyer</button>
      <p>Réponse : {response && JSON.stringify(response)}</p>
    </div>
  );
}

function ArticleGenerator() {
  return <h2>Générateur d'Articles</h2>;
}

function Articles() {
  return <h2>Articles</h2>;
}

export default App;
