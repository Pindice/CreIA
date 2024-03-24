// HomeArticles.js

import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Row, Col } from 'react-bootstrap';

function HomeArticles() {
  const [articles, setArticles] = useState([]);
  const [show, setShow] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 12;
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);

  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
};
  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
};

  const handleClose = () => setShow(false);
  const handleShow = (article) => {
    setSelectedArticle(article);
    setShow(true);
  };

  useEffect(() => {
    fetch('http://localhost:8000/articles?is_temporary=false&consider_date=true')
      .then((response) => response.json())
      .then((data) => {
        const sortedArticles = data.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
        setArticles(sortedArticles);
      });
  }, []);


   // Fonction pour créer un extrait du contenu
   const createExcerpt = (htmlContent) => {
    // Convertir le HTML en document DOM pour extraire le texte
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    const textContent = doc.body.textContent || ""; // Extraire le texte
    return textContent.length > 100 ? textContent.substring(0, 100) + "..." : textContent;
    };

  return (
    <>
    <Row xs={1} sm={1} md={2} lg={3} className="g-4"> {/* Ajoutez un peu d'espacement entre les cards */}
      {currentArticles.map((article, idx) => (
        <Col key={idx}>
          <Card style={{ width: '18rem' }}>
            <Card.Img variant="top" src={article.image ? `http://localhost:8000/${article.image.replace("\\", "/")}` : "placeholder-image-url"} />
            <Card.Body>
              <Card.Title>{article.title}</Card.Title>
              <Card.Text>
                <small className="text-muted">Publié le: {new Date(article.last_date).toLocaleDateString()}</small>
              </Card.Text>
              <Card.Text>
                {createExcerpt(article.content)}
              </Card.Text>
              <Button variant="primary" onClick={() => handleShow(article)}>
                Lire plus
              </Button>
            </Card.Body>
          </Card>
        </Col>
      ))}

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedArticle?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body><div dangerouslySetInnerHTML={{ __html: selectedArticle?.content }}></div></Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Row>


    <div className="d-flex justify-content-center align-items-center mt-4">
      <Button onClick={handlePrevPage} disabled={currentPage === 1}>
        Précédent
      </Button>
      <span className="mx-3">
        Page {currentPage} sur {totalPages}
      </span>
      <Button onClick={handleNextPage} disabled={currentPage === totalPages}>
        Suivant
      </Button>
    </div>
    </>
  );
}

export default HomeArticles;
