import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';


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

  const updateArticleContent = async (articleId, newContent) => {
    // Mettre à jour l'état local
    const updatedArticles = articles.map((article) => {
      if (article.id === articleId) {
        return { ...article, content: newContent };
      }
      return article;
    });
    setArticles(updatedArticles);
  
    // Envoie la mise à jour à l'API
    try {
      await fetch(`http://127.0.0.1:8000/articles/${articleId}`, {
        method: 'PUT', // Assurez-vous que votre API backend supporte cette méthode pour la mise à jour
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });
    } catch (error) {
      console.error('Error updating article:', error);
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
              <CKEditor
              editor={ClassicEditor}
              data={article.content} // Assurez-vous que cela est correctement lié à chaque article spécifique
              onChange={(event, editor) => {
                const data = editor.getData();
                updateArticleContent(article.id, data);
              }}/>
              <button style={{ marginBottom: '20px' }} onClick={() => deleteArticle(article.id)}>Supprimer</button>
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
