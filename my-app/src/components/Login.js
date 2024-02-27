import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
            navigate('/article-generator');
        } catch (error) {
            alert('Identifiants incorrects ou problème de connexion');
            console.error(error);
        }
    };
    

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label>
                    Nom d'utilisateur:
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
                </label>
                <label>
                    Mot de passe:
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </label>
                <button type="submit">Connexion</button>
            </form>
        </div>
    );
}

export default Login;