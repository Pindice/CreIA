import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Chatbot from './components/Chatbot';
import ArticleGenerator from './components/ArticleGenerator';
import Articles from './components/Article';
import Login from './components/Login';
import HomeArticles from './components/HomeArticles';
import { ReactComponent as ChatIcon } from './assets/chat-icon.svg';


function App() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
  }, []);

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    window.location.href = '/login';
  };

  return (
    <>
      <Router>
        <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
          <Container>
            <Navbar.Brand href="/">Mon Blog</Navbar.Brand>
            <Nav className="me-auto">
              <Link to="/article-generator" className="nav-link">Générateur d'Articles</Link>
              <Link to="/articles" className="nav-link">Articles</Link>
            </Nav>
            <Nav className="ms-auto">
              {!isLoggedIn ? (
                <Link to="/login" className="nav-link">Login</Link>
              ) : (
                <Nav.Link as="span" onClick={logout} style={{cursor: 'pointer'}}>Déconnexion</Nav.Link>
              )}
            </Nav>
          </Container>
        </Navbar>
        <Container style={{ marginTop: '20px' }}>
          <Routes>
            <Route path="/article-generator" element={isLoggedIn ? <ArticleGenerator /> : <Login setIsLoggedIn={setIsLoggedIn}/>} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          </Routes>
        </Container>
      </Router>
      <div style={{ position: 'fixed', bottom: 10, right: 10, cursor: 'pointer', zIndex: 1050 }}>
        <ChatIcon onClick={() => setShowChatbot(!showChatbot)} />
      </div>
      {showChatbot && <Chatbot />} {/* Ceci place le Chatbot sur toutes les pages, en bas à droite */}
    </>
  );
}

function Home() {
  return (
    <div>
      <h2>Accueil</h2>
      <HomeArticles />
    </div>
  );
}

export default App;


// function ArticleGenerator() {
//   return <h2>Générateur d'Articles</h2>;
// }

// function Articles() {
//   return <h2>Articles</h2>;
// }


// function Chatbot() {
//   const [message, setMessage] = useState(""); // État pour le message à envoyer
//   const [response, setResponse] = useState(""); // État pour la réponse reçue
//   // Fonction pour envoyer le message lorsque l'utilisateur appuie sur "Envoyer"
//   const sendMessage = async () => {
//     try {
//       const response = await fetch("http://127.0.0.1:8000/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ user_message: message }),
//       });
//       const data = await response.json();
//       console.log(data);
//       if (data.messageResponse && typeof data.messageResponse === 'object') {
//         // Assurez-vous d'accéder à la propriété 'content' si 'messageResponse' est un objet.
//         setResponse(data.messageResponse.content);
//       } else {
//         // Si 'messageResponse' est une chaîne, vous pouvez la définir directement.
//         setResponse(data.messageResponse);
//       }
//     } catch (error) {
//       console.error("Erreur lors de la requête : ", error);
//     }
//   };
//   // Fonction pour gérer les changements dans le champ de texte, mise à jour de l'état du message
//   const handleInputChange = (e) => {
//     setMessage(e.target.value);
//   };
//   return (
//     <div>
//       <h2>Chatbot</h2>
//       <input
//         type="text"
//         value={message}
//         onChange={handleInputChange}
//       />
//       <button onClick={sendMessage}>Envoyer</button>
//       <p>Réponse : {response}</p> {/* Ici, nous affichons la chaîne de réponse */}
//     </div>
//   );  
// }