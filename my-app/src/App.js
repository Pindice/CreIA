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
  const [message, setMessage] = useState(""); // État pour le message à envoyer
  const [response, setResponse] = useState(""); // État pour la réponse reçue
  // Fonction pour envoyer le message lorsque l'utilisateur appuie sur "Envoyer"
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
      console.log(data);
      if (data.messageResponse && typeof data.messageResponse === 'object') {
        // Assurez-vous d'accéder à la propriété 'content' si 'messageResponse' est un objet.
        setResponse(data.messageResponse.content);
      } else {
        // Si 'messageResponse' est une chaîne, vous pouvez la définir directement.
        setResponse(data.messageResponse);
      }
    } catch (error) {
      console.error("Erreur lors de la requête : ", error);
    }
  };
  // Fonction pour gérer les changements dans le champ de texte, mise à jour de l'état du message
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
      <button onClick={sendMessage}>Envoyer</button>
      <p>Réponse : {response}</p> {/* Ici, nous affichons la chaîne de réponse */}
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