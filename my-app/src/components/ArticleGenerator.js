import React, { useState } from 'react';

const ArticleGenerator = () => {
  const [topic, setTopic] = useState('');
  const [article, setArticle] = useState('');

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
            console.log("Article saved successfully");
        } else {
            console.error("Failed to save article");
        }
    } catch (error) {
        console.error('Error saving article:', error);
    }
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
      </div>
    </div>
  );
};

export default ArticleGenerator;
