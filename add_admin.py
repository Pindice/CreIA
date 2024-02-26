# add_admin.py
from main import Admin, SessionLocal, engine
from sqlalchemy.orm import Session
import bcrypt

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def create_admin(db: Session, username: str, password: str):
    hashed_password = get_password_hash(password)
    db_admin = Admin(username=username, password=hashed_password)
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

def main():
    # Créer la table Admins si elle n'existe pas déjà
    Admin.__table__.create(bind=engine, checkfirst=True)
    
    # Ajouter un nouvel admin
    username = "pindice"  # Remplacer par le nom d'utilisateur souhaité
    password = "974"  # Remplacer par le mot de passe souhaité
    
    db = SessionLocal()
    create_admin(db, username, password)
    db.close()
    print(f"L'admin {username} a été créé avec succès.")

if __name__ == "__main__":
    main()
