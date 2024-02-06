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
      </div>
    </div>
  );
};

export default ArticleGenerator;
