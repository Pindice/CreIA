import React, { useState } from 'react';

function Login({ setIsLoggedIn }) { // Recevoir setIsLoggedIn comme prop
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
  
    const handleSubmit = (event) => {
      event.preventDefault();
      if (username === 'admin' && password === 'admin') { // Exemple de vérification
        localStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
        // Rediriger vers une page après la connexion
        window.location.href = '/article-generator';
      } else {
        alert('Identifiants incorrects');
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
