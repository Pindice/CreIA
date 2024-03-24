import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container } from 'react-bootstrap';

function Login({ setIsLoggedIn }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
    
        try {
            const response = await axios.post('http://localhost:8000/token', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const { access_token } = response.data;
            localStorage.setItem('token', access_token); // Stocker le token dans le stockage local
            localStorage.setItem('isLoggedIn', 'true'); // Stocker explicitement le statut de connexion
            setIsLoggedIn(true);
            navigate('/');
        } catch (error) {
            alert('Identifiants incorrects ou problème de connexion');
            console.error(error);
        }
    };
    

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicUsername">
                    <Form.Label>Nom d'utilisateur</Form.Label>
                    <Form.Control type="text" placeholder="Entrez votre nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
                </Form.Group>

                <Button variant="primary" type="submit">
                    Connexion
                </Button>
            </Form>
        </Container>
    );
}

export default Login;