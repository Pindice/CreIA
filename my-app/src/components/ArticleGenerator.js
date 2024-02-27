import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';


const ArticleGenerator = () => {
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [article, setArticle] = useState('');
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
      setModalMessage('');
    } catch (error) {
      console.error('Error generating article:', error);
      setArticle('Failed to generate article. Please try again.');
    }
    setIsGenerating(false);
  };

  const saveArticle = async () => {
    const formData = new FormData();
    formData.append('topic', topic);
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
          setModalMessage("Article saved successfully");
          closeModalAndRedirect();
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
      <button onClick={generateArticle} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Article'}
      </button>
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
      <button onClick={() => setShowModal(true)}>Save Article</button>
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
