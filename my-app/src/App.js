import React, { useState, useEffect } from 'react'; // Importation de useState
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap'; // Button retiré car non utilisé
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand href="/">Mon App</Navbar.Brand>
          <Nav className="me-auto">
            {/* Utilisation de Link de react-router-dom avec la prop 'as' pour une intégration fluide avec React-Bootstrap */}
            <Link to="/" className="nav-link">Accueil</Link>
            <Link to="/chatbot" className="nav-link">Chatbot</Link>
            <Link to="/article-generator" className="nav-link">Générateur d'Articles</Link>
            <Link to="/articles" className="nav-link">Articles</Link>
          </Nav>
        </Container>
      </Navbar>
      <Container style={{ marginTop: '20px' }}>
        <Routes>
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/article-generator" element={<ArticleGenerator />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </Container>
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
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_message: message }),
      });
      const data = await response.json();
      setResponse(data);
    } catch (error) {
      console.error("Erreur lors de la requête : ", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_message: message }),
        });
        const data = await response.json();
        setResponse(data);
      } catch (error) {
        console.error("Erreur lors de la requête : ", error);
      }
    };

    fetchData();
  }, [message]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  return (
    <div>
      <h2>Chatbot</h2>
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
      />
      <button onClick={sendMessage} variant="primary">Envoyer</button>
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