import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';


const ArticleGenerator = () => {
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [article, setArticle] = useState('');
  const [articleId, setArticleId] = useState(null); // Pour stocker l'ID de l'article généré
  const [initialContent, setInitialContent] = useState('');
  const [showGenerateButton, setShowGenerateButton] = useState(true); // Pour contrôler l'affichage du bouton de génération
  const [selectedImage, setSelectedImage] = useState(null);
  const [publishDate, setPublishDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const navigate = useNavigate();

  const closeModalAndRedirect = () => {
    setShowModal(false); // Fermer le modal
    navigate('/articles'); // Rediriger vers l'URL des articles
  };

  const handleImageChange = (e) => {
    setSelectedImage(e.target.files[0]);
  };

  const handleDateChange = (e) => {
    setPublishDate(e.target.value);
  };

  const generateArticle = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/generate_article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, instructions }),
      });
      const data = await response.json();
      setArticle(data.article);
      setArticleId(data.article_id);
      setModalMessage('');
      setShowGenerateButton(false);
    } catch (error) {
      console.error('Error generating article:', error);
      setArticle('Failed to generate article. Please try again.');
    }
    setIsGenerating(false);
    setShowGenerateButton(false);
  };

  const saveArticle = async () => {
    // if (article === initialContent) {
    //   alert("No changes detected. Article not saved."); // Vous pouvez choisir de ne pas sauvegarder ou d'informer l'utilisateur
    //   return;
    // }
    const formData = new FormData();
    formData.append('article_id', articleId);
    formData.append('topic', topic);
    formData.append('instructions', instructions)
    formData.append('content', article);
    if (selectedImage) {
      formData.append('image', selectedImage);
    }
    formData.append('last_date', publishDate);
    try {
        // Assurez-vous que 'article' contient le texte généré par l'IA
        const response = await fetch('http://127.0.0.1:8000/save_article', {
            method: 'POST',
            body: formData,
        });
        if (response.ok) {
          const responseData = await response.json();
          setModalMessage(responseData.message);
          if (responseData.message.includes("No changes detected")) {
            // Affichez un message spécifique ou gérez ce cas comme nécessaire
            alert(responseData.message); // Par exemple
          } else {
            closeModalAndRedirect();
          }
        } else {
          const errorData = await response.json();
          console.error('Error saving article:', errorData);
          setModalMessage("Failed to save article: " + JSON.stringify(errorData.errors));
        }
        
        
    } catch (error) {
        console.error('Error saving article:', error);
        setModalMessage("Error saving article. Please try again.");
    }
    setShowModal(true);
  };

  const regenerateArticle = async () => {
    setIsGenerating(true); // Indiquer que la génération est en cours
    try {
      const response = await fetch(`http://127.0.0.1:8000/regenerate_article/${articleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions: instructions, // Utiliser l'état local 'instructions' pour les nouvelles instructions
        }),
      });
  
      if (!response.ok) throw new Error('Failed to regenerate article');
  
      const data = await response.json();
      setArticle(data.new_content); // Mettre à jour l'article avec le nouveau contenu généré
      setIsGenerating(false); // Réinitialiser l'indicateur de génération
    } catch (error) {
      console.error('Error regenerating article:', error);
      setIsGenerating(false); // Assurez-vous de réinitialiser l'indicateur même en cas d'erreur
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
      <br></br>
      <textarea
      value={instructions}
      onChange={(e) => setInstructions(e.target.value)}
      placeholder="Enter customization instructions..."
      rows="4"  // Nombre de lignes dans la zone de texte
      ></textarea>
      <br></br>
      {showGenerateButton && (
        <button onClick={generateArticle} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Article'}
        </button>
      )}
      <div>
        {article && <div><h3>Generated Article</h3><CKEditor
        editor={ClassicEditor}
        data={article}
        onChange={(event, editor) => {
          const data = editor.getData();
          setArticle(data);
          }}/>
      </div>}
      <br></br>
      {articleId && (
        <>
          <button onClick={regenerateArticle} disabled={isGenerating}>
            {isGenerating ? 'Regenerating...' : 'Regenerate Article'}
          </button>
          <button onClick={() => setShowModal(true)}>Save Article</button>
        </>
      )}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Save Article</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Article Image</Form.Label>
              <Form.Control type="file" onChange={handleImageChange} />
            </Form.Group>
            <Form.Group controlId="formPublishDate">
              <Form.Label>Publish Date</Form.Label>
              <Form.Control type="date" onChange={handleDateChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={saveArticle}>
            Save Article
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </div>
  );
};

export default ArticleGenerator;
