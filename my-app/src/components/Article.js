import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';



const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const navigate = useNavigate();

  // Fonction pour charger les articles depuis le backend
  const fetchArticles = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/articles?consider_date=false');
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  // Fonction pour supprimer un article
  const deleteArticle = async () => {
    if (articleToDelete) {
      try {
        await fetch(`http://127.0.0.1:8000/articles/${articleToDelete}`, {
          method: 'DELETE',
        });
        setIsConfirmModalOpen(false); // Fermer le modal de confirmation
        setIsSuccessModalOpen(true); // Ouvrir le modal de succès
        fetchArticles(); // Recharger les articles après la suppression
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  const askDeleteArticle = (articleId) => {
    setArticleToDelete(articleId);
    setIsConfirmModalOpen(true);
  };

  // Charger les articles au montage du composant
  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div>
      <h2>Liste des Articles</h2>
      {articles.length ? (
        <ul>
          {articles.map((article) => (
            <li key={article.id}>
              <h3>{article.topic}</h3>
              <div
                dangerouslySetInnerHTML={{ __html: article.content }}
                style={{
                  height: '200px', 
                  overflowY: 'scroll', 
                  border: '1px solid #ccc',
                  padding: '10px', 
                  marginBottom: '10px'
                }}
              ></div>
              <button style={{ marginRight: '10px' }} onClick={() => navigate(`/article-generator/${article.id}`)}>Modifier</button>
              <button onClick={() => askDeleteArticle(article.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun article trouvé.</p>
      )}

      {/* Modal de confirmation */}
      <Modal show={isConfirmModalOpen} onHide={() => setIsConfirmModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation de suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>Êtes-vous sûr de vouloir supprimer cet article ?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>
            Non
          </Button>
          <Button variant="primary" onClick={deleteArticle}>
            Oui
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de succès */}
      <Modal show={isSuccessModalOpen} onHide={() => setIsSuccessModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Suppression réussie</Modal.Title>
        </Modal.Header>
        <Modal.Body>L'article a été supprimé avec succès.</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setIsSuccessModalOpen(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Articles;