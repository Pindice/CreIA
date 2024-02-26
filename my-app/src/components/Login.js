import React, { useState } from 'react';
import axios from 'axios';

function Login({ setIsLoggedIn }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

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
            setIsLoggedIn(true);
            window.location.href = '/article-generator';
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