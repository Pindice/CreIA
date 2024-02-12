import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';


const ArticleGenerator = () => {
  const [topic, setTopic] = useState('');
  const [article, setArticle] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const navigate = useNavigate();


  const generateArticle = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/generate_article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      setArticle(data.article);
      setModalMessage('');
    } catch (error) {
      console.error('Error generating article:', error);
      setArticle('Failed to generate article. Please try again.');
    }
  };

  const saveArticle = async () => {
    try {
        // Assurez-vous que 'article' contient le texte généré par l'IA
        const response = await fetch('http://127.0.0.1:8000/save_article', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic, content: article }), // 'article' devrait être le contenu généré par l'IA
        });
        if (response.ok) {
          setModalMessage("Article saved successfully");
        } else {
          setModalMessage("Failed to save article");
        }
    } catch (error) {
        console.error('Error saving article:', error);
        setModalMessage("Error saving article. Please try again.");
    }
    setShowModal(true);
  };

  const closeModalAndRedirect = () => {
    setShowModal(false); // Fermer le modal
    navigate('/articles'); // Rediriger vers l'URL des articles
  };

  return (
    <div>
      <h2>Générateur d'Articles</h2>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter article topic..."
      />
      <button onClick={generateArticle}>Generate Article</button>
      <div>
        {article && <div><h3>Generated Article</h3><p>{article}</p></div>}
        <button onClick={() => saveArticle(topic, article)}>Save Article</button>
        <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Article Save Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModalAndRedirect}>
            Go to Articles
          </Button>
        </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default ArticleGenerator;
