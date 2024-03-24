import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Container, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';


const ArticleGenerator = () => {
  let { id } = useParams();
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
  const [mode, setMode] = useState(articleId ? "edit" : "create");
  const [history, setHistory] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticleData = async () => {
      if (!id) {
        setTopic('');
        setInstructions('');
        setArticle('');
        setArticleId(null);
        setMode("create");
        setShowGenerateButton(true);
        // Réinitialisez ici tout autre état nécessaire
      } else {  // Si un 'id' est récupéré depuis les paramètres de l'URL
        try {
          const response = await fetch(`http://127.0.0.1:8000/articles/${id}`);
          if (!response.ok) throw new Error('Failed to fetch article data');
          const data = await response.json();
          setTopic(data.topic);
          setInstructions(data.instructions);
          setArticle(data.content);
          setArticleId(id); // Assurez-vous que cette ligne est nécessaire pour votre logique
          setMode("edit"); // Changez le mode en "edit"
          setShowGenerateButton(false); // Cachez le bouton générer car vous êtes en mode édition
          // Chargez également l'historique ici
          const historyResponse = await fetch(`http://127.0.0.1:8000/article_history/${id}`);
            if (!historyResponse.ok) throw new Error('Failed to fetch history');
            const historyData = await historyResponse.json();
            setHistory(historyData);
          } catch (error) {
            console.error('Error:', error);
        }
      }
    };
    fetchArticleData();
  }, [id]); // L'effet dépend de 'id'


  const closeModalAndRedirect = () => {
    setShowModal(false);
    navigate('/articles');
    // Ajoutez ici la réinitialisation des états à leurs valeurs par défaut
    resetState();
  };

  const resetState = () => {
    setTopic('');
    setInstructions('');
    setArticle('');
    setArticleId(null);
    setShowGenerateButton(true);
    // Réinitialisez ici tout autre état nécessaire
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
    const url = mode === "create" ? 'http://127.0.0.1:8000/save_article' : `http://127.0.0.1:8000/articles/${articleId}`;
    const method = mode === "create" ? 'POST' : 'PUT';
    const authToken = localStorage.getItem('token');
    const title = topic;
    const formData = new FormData();
    formData.append('article_id', articleId);
    formData.append('title', title);
    formData.append('topic', topic);
    formData.append('instructions', instructions)
    formData.append('content', article);
    if (selectedImage) {
      formData.append('image', selectedImage);
    }
    formData.append('last_date', publishDate);
    try {
        // Assurez-vous que 'article' contient le texte généré par l'IA
        const response = await fetch(url, {
          method: method,
          headers: {
            // 'Content-Type': 'application/json', // Changez en 'multipart/form-data' si vous envoyez des fichiers
            'Authorization': `Bearer ${authToken}`, // Ajouter le header d'autorisation
          },
          body: formData
        });
        const responseData = await response.json();
        if (response.ok) {
          setModalMessage(responseData.message);
          closeModalAndRedirect();
        } else {
          console.error('Error saving article:', responseData);
          setModalMessage("Failed to save article: " + JSON.stringify(responseData));
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
          topic,
          instructions, // Utiliser l'état local 'instructions' pour les nouvelles instructions
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
      <h2>{mode === "create" ? "Créer un Nouvel Article" : "Modifier l'Article"}</h2>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Sujet de l'article</Form.Label>
          <Form.Control
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Entrez le sujet de l'article..."
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Instructions de personnalisation</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Entrez les instructions de personnalisation..."
          />
        </Form.Group>
      <br />
      {mode === "edit" && history.length > 0 && (
        <div>
          <label htmlFor="historySelect">Select Previous Version:</label>
          <select
            id="historySelect"
            onChange={(e) => {
              const selectedHistoryId = e.target.value;
              const selectedVersion = history.find(h => h.id.toString() === selectedHistoryId);
              if (selectedVersion) {
                setSelectedVersion(selectedVersion);
                // Ici, ajustez les états du formulaire en fonction de la version sélectionnée
                setArticle(selectedVersion.previous_content);
                setInstructions(selectedVersion.previous_instructions);
                // Ajoutez d'autres champs si nécessaire
              }
            }}
          >
            <option value="">Select a version</option>
            {history.map((h) => (
              <option key={h.id} value={h.id}>
                {new Date(h.date_modif).toLocaleDateString()} - Version {h.id}
              </option>
            ))}
          </select>
        </div>
      )}
      <br />
      {showGenerateButton && mode === "create" && (
          <Button onClick={generateArticle} disabled={isGenerating} variant="primary">
            {isGenerating ? 'Génération...' : 'Générer Article'}
          </Button>
        )}
      {article && (
        <div>
          <h3>Generated Article</h3>
          <div style={{ height: '500px', overflow: 'auto', position: 'relative' }}>
            <CKEditor
              editor={ClassicEditor}
              data={article}
              onChange={(event, editor) => {
                const data = editor.getData();
                setArticle(data);
              }}
            />
          </div>
        </div>
      )}
      <br />
      {articleId && mode === "create" && (
        <Button onClick={regenerateArticle} disabled={isGenerating} variant="primary" className="me-2">
          {isGenerating ? 'Regenerating...' : 'Regenerate Article'}
        </Button>
      )}
      {article && (
        <Button onClick={() => setShowModal(true)}>
          {mode === "create" ? "Save Article" : "Update Article"}
        </Button>
      )}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{mode === "create" ? "Save Article" : "Update Article"}</Modal.Title>
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
            {mode === "create" ? "Save Article" : "Update Article"}
          </Button>
        </Modal.Footer>
      </Modal>
      </Form>
    </div>
  );
};

export default ArticleGenerator;
