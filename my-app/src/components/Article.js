import React, { useState, useEffect } from 'react';

const Articles = () => {
  const [articles, setArticles] = useState([]);

  // Fonction pour charger les articles depuis le backend
  const fetchArticles = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/articles');
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  // Fonction pour supprimer un article
  const deleteArticle = async (articleId) => {
    try {
      await fetch(`http://127.0.0.1:8000/articles/${articleId}`, {
        method: 'DELETE',
      });
      // Recharger les articles après la suppression
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
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
              <p>{article.content}</p>
              <button onClick={() => deleteArticle(article.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun article trouvé.</p>
      )}
    </div>
  );
};

export default Articles;
