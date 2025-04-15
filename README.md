# 🎭 Multilang Theater App

Web-App zur Simultanübersetzung von Theaterstücken – jede*r Zuschauer*in wählt die Sprache, der Admin steuert zentral.

## 🔧 Setup

```bash
git clone https://github.com/deinname/multilang-theater-app.git
cd multilang-theater-app
cp webapp/.env.example webapp/.env
cp .env.example .env
docker-compose up --build
```

## 📁 Audio-Dateien

Ordnerstruktur:
```
webapp/public/audio/de/intro.mp3
webapp/public/audio/en/intro.mp3
...
```

## 🛠 Admin-Login

Wird durch Passwort aus `.env` geschützt (`REACT_APP_ADMIN_PASSWORD`).
