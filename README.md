# Salon Fryzjerski - System Rezerwacji z AI Asystentem

Nowoczesny system rezerwacji wizyt dla salonu fryzjerskiego z inteligentnym asystentem AI opartym na OpenAI Agents SDK. Aplikacja umozliwia klientom rezerwacje wizyt online oraz zadawanie pytan o uslugi przez konwersacyjnego chatbota.

![Tech Stack](https://img.shields.io/badge/React-19-blue?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)

---

## Funkcjonalnosci

### Inteligentny Asystent AI (RAG Agent)
- **Konwersacyjna rezerwacja** - klient moze umowic wizyte przez naturalna rozmowe
- **Odpowiedzi na pytania** - informacje o cenniku, uslugach, godzinach otwarcia
- **Pamiec kontekstu** - agent pamieta przebieg rozmowy w sesji
- **Weryfikacja dostepnosci** - sprawdzanie wolnych terminow w czasie rzeczywistym
- **Ochrona przed prompt injection** - sanityzacja zapytan uzytkownika

### System Rezerwacji
- Rezerwacja wizyt online z kodem potwierdzenia
- Sprawdzanie dostepnosci terminow z uwzglednieniem grafiku pracownikow
- Zarzadzanie rezerwacjami (panel administracyjny)
- Automatyczne powiadomienia email (Brevo)
- Anulowanie rezerwacji przez kod potwierdzenia

### Zarzadzanie Zespolem
- Profile pracownikow ze zdjeciami
- Specjalizacje i opisy (JSON column)
- Indywidualny grafik pracy i wyjatki (urlopy, zmiany godzin)
- Przypisywanie pracownikow do rezerwacji

### Panel Administracyjny
- Autentykacja HMAC z HTTP-only cookies
- Zarzadzanie uslugami i cenami
- Zarzadzanie rezerwacjami (statusy, filtrowanie)
- Edycja bazy wiedzy (upload, sync, ingest)
- Zarzadzanie grafikiem pracy (salon + indywidualny)
- Czarna lista numerow telefonow i emaili

### Baza Wiedzy (RAG)
- Wektorowa baza wiedzy z pgvector
- Automatyczne chunkowanie (langchain-text-splitters) i embeddingi (OpenAI)
- Auto-ingest przy starcie aplikacji
- Wyszukiwanie semantyczne (cosine similarity)

---

## Architektura

```
+-----------------+     +-----------------+     +-----------------+
|   Frontend      |---->|   FastAPI       |---->|   PostgreSQL    |
|   React + Vite  |<----|   Backend       |<----|   + pgvector    |
+-----------------+     +-----------------+     +-----------------+
                               |
                               v
                        +-----------------+
                        | OpenAI Agents   |
                        | SDK (Agent +    |
                        | function tools) |
                        +-----------------+
                               |
                               v
                        +-----------------+
                        |   OpenAI API    |
                        |   Embeddings +  |
                        |   Chat LLM     |
                        +-----------------+
```

---

## Technologie

### Frontend
- **React 19** - UI library
- **TypeScript** - typowanie
- **Vite 7** - build tool
- **Tailwind CSS 3** - stylowanie
- **shadcn/ui + Radix** - komponenty UI
- **React Router 7** - nawigacja
- **GSAP** - animacje
- **Recharts** - wykresy
- **Zod** - walidacja formularzy

### Backend
- **FastAPI** - framework API
- **SQLAlchemy 2.0** - ORM (async)
- **PostgreSQL + pgvector** - baza danych z wyszukiwaniem wektorowym
- **OpenAI Agents SDK** - agent AI z function tools
- **OpenAI API** - embeddingi i LLM
- **langchain-text-splitters** - chunkowanie dokumentow
- **Pydantic** - walidacja danych
- **httpx** - klient HTTP (Brevo API)
- **tiktoken** - tokenizacja tekstu

---

## Struktura Projektu

```
├── app/                          # Frontend React
│   └── src/
│       ├── components/           # Komponenty React
│       │   └── ui/               # shadcn/ui components
│       ├── pages/                # Strony aplikacji
│       │   └── admin/            # Panel administracyjny
│       ├── sections/             # Sekcje stron
│       ├── hooks/                # Custom hooks
│       ├── services/             # API client functions
│       ├── lib/                  # Utilities
│       ├── data/                 # Statyczne dane
│       └── types/                # TypeScript types
│
├── backend/                      # Backend FastAPI
│   ├── src/
│   │   ├── api/v1/endpoints/     # API endpoints
│   │   │   └── admin/            # Endpointy administracyjne
│   │   ├── services/             # Logika biznesowa
│   │   │   ├── rag/              # RAG + ingest (embeddingi)
│   │   │   ├── booking/          # Rezerwacje + agent AI
│   │   │   ├── team/             # Zarzadzanie zespolem
│   │   │   ├── service/          # Zarzadzanie uslugami
│   │   │   └── admin/            # Autentykacja admina
│   │   ├── schemas/              # Pydantic models
│   │   ├── core/                 # Wyjatki domenowe
│   │   ├── config.py             # Konfiguracja (env)
│   │   └── main.py               # Entry point
│   └── database/
│       ├── models.py             # SQLAlchemy models
│       ├── config.py             # Engine, session, init_db
│       ├── repositories/         # Warstwa dostepu do danych
│       ├── data/                 # Baza wiedzy (markdown)
│       └── member_photos/        # Zdjecia pracownikow
│
├── poradniki/                    # Poradniki budowy aplikacji (Faza 0-8)
├── docker-compose.yml            # PostgreSQL + Adminer
├── requirements.txt              # Zaleznosci Python
└── .env.example                  # Przykladowa konfiguracja
```

---

## Instalacja

### Wymagania
- Python 3.13+
- Node.js 20+
- Docker + Docker Compose

### 1. Klonowanie repozytorium
```bash
git clone <repo-url>
cd fryzjer_szymon
```

### 2. Konfiguracja srodowiska
```bash
# Skopiuj plik konfiguracyjny
cp .env.example .env

# Edytuj .env i uzupelnij:
# - DATABASE_URL
# - OPENAI_API_KEY
# - SECRET_KEY (min 32 znaki)
# - ADMIN_PASSWORD
# - BREVO_API_KEY (opcjonalnie)
```

### 3. Uruchomienie bazy danych
```bash
docker-compose up -d
```
- PostgreSQL dostepny na porcie `5434`
- Adminer (UI do bazy): http://localhost:8081

### 4. Backend
```bash
# Utworz virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate

# Linux/Mac:
source venv/bin/activate

# Instalacja zaleznosci
pip install -r requirements.txt

# Uruchomienie serwera
cd backend
uvicorn src.main:app --reload --port 8000
```

API dostepne pod: http://localhost:8000
Dokumentacja: http://localhost:8000/docs

### 5. Frontend
```bash
cd app
npm install
npm run dev
```

Aplikacja dostepna pod: http://localhost:5173

---

## Konfiguracja

### Zmienne srodowiskowe (`.env`)

```env
# Baza danych
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5434/salon

# Bezpieczenstwo
SECRET_KEY=change-this-to-random-secret-key-min-32-characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# OpenAI (wymagane dla RAG i chatbota)
OPENAI_API_KEY=sk-...
OPENAI_LLM_MODEL=gpt-5.4-nano
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Email (opcjonalnie)
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=your@email.com
BREVO_SENDER_NAME=Salon Fryzjerski

# RAG Settings
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
RAG_SIMILARITY_THRESHOLD=0.3

# Srodowisko
DEBUG=true
```

---

## API Endpoints

### RAG / AI Asystent
| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/v1/rag/ask` | Zapytanie do asystenta AI |
| POST | `/api/v1/rag/search` | Wyszukiwanie semantyczne w bazie wiedzy |
| GET | `/api/v1/rag/health` | Status RAG (liczba chunkow, model) |

### Rezerwacje
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/v1/bookings/availability` | Sprawdz dostepnosc terminow |
| POST | `/api/v1/bookings` | Utworz rezerwacje |
| POST | `/api/v1/bookings/{id}/cancel` | Anuluj rezerwacje |

### Uslugi
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/v1/services` | Lista uslug |
| GET | `/api/v1/services/{id}` | Szczegoly uslugi |

### Zespol
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/v1/team` | Lista pracownikow |
| GET | `/api/v1/team/{id}` | Szczegoly pracownika |

### Admin - Autentykacja
| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/v1/admin/auth/login` | Logowanie (HMAC + cookie) |
| POST | `/api/v1/admin/auth/logout` | Wylogowanie |
| GET | `/api/v1/admin/auth/check` | Sprawdz sesje |

### Admin - Zarzadzanie (wymagana autentykacja)
| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/v1/services` | Dodaj usluge |
| PATCH | `/api/v1/services/{id}` | Edytuj usluge |
| DELETE | `/api/v1/services/{id}` | Usun usluge |
| POST | `/api/v1/team` | Dodaj pracownika |
| PATCH | `/api/v1/team/{id}` | Edytuj pracownika |
| DELETE | `/api/v1/team/{id}` | Usun pracownika |
| GET | `/api/v1/bookings/admin/bookings` | Lista rezerwacji (filtrowanie) |
| PATCH | `/api/v1/bookings/admin/bookings/{id}` | Zmien status rezerwacji |
| DELETE | `/api/v1/bookings/admin/bookings/{id}` | Usun rezerwacje |

### Admin - Grafik pracy
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/v1/admin/working-hours` | Tygodniowy grafik salonu |
| PUT | `/api/v1/admin/working-hours/{day}` | Edytuj godziny dnia |
| POST | `/api/v1/admin/working-hours/init` | Inicjalizuj domyslny grafik |
| GET | `/api/v1/admin/member-working-hours` | Wyjatki grafiku pracownikow |
| POST | `/api/v1/admin/member-working-hours` | Dodaj wyjatek |
| PATCH | `/api/v1/admin/member-working-hours/{id}` | Edytuj wyjatek |
| DELETE | `/api/v1/admin/member-working-hours/{id}` | Usun wyjatek |

### Admin - Czarna lista
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/v1/admin/blacklist/phones` | Lista zablokowanych |
| POST | `/api/v1/admin/blacklist/phones` | Dodaj do blacklisty |
| DELETE | `/api/v1/admin/blacklist/phones/{id}` | Usun z blacklisty |
| GET | `/api/v1/admin/blacklist/phones/check/{phone}` | Sprawdz telefon |
| GET | `/api/v1/admin/blacklist/check-email/{email}` | Sprawdz email |

### Admin - Baza wiedzy
| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/v1/admin/knowledge/upload` | Upload pliku wiedzy |
| GET | `/api/v1/admin/knowledge/files` | Lista plikow |
| GET | `/api/v1/admin/knowledge/files/{name}` | Zawartosc pliku |
| PUT | `/api/v1/admin/knowledge/files/{name}` | Edytuj plik |
| DELETE | `/api/v1/admin/knowledge/files/{name}` | Usun plik |
| POST | `/api/v1/admin/knowledge/files/{name}/ingest` | Ingestuj plik |
| POST | `/api/v1/admin/knowledge/sync` | Synchronizuj cala baze |
| GET | `/api/v1/admin/knowledge/sync/status` | Status synchronizacji |

### Admin - Uploads
| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/v1/admin/uploads/team-member-photo` | Upload zdjecia pracownika |

---

## Jak dziala RAG Agent?

```
Uzytkownik: "Chce umowic strzyzenie na jutro 14:00"
         |
         v
+---------------------+
|  OpenAI Agents SDK  |
|  - analiza intencji |
|  - function tools   |
+---------------------+
         |
         v
+---------------------+     +-----------------+
|  Tool: check_       |---->|  BookingService |
|  availability       |<----|  - sprawdza     |
|  (sprawdz terminy)  |     |  dostepnosc     |
+---------------------+     +-----------------+
         |
         v
Odpowiedz: "Mam wolne o 14:00. Podaj swoje dane..."
         |
         v
[Uzytkownik podaje dane]
         |
         v
+---------------------+
|  Podsumowanie +     |
|  prosba o           |
|  potwierdzenie      |
|  requires_          |
|  confirmation: true |
+---------------------+
         |
         v
[Uzytkownik: "tak"]
         |
         v
+---------------------+     +-----------------+
|  Tool: create_      |---->|  BookingService |
|  booking            |<----|  - tworzy       |
|  (finalizacja)      |     |  rezerwacje     |
+---------------------+     +-----------------+
         |
         v
REZERWACJA UTWORZONA!
   Kod potwierdzenia: ABC123
```

Agent posiada 10 function tools: sprawdzanie dostepnosci, tworzenie rezerwacji, anulowanie, lista uslug, lista pracownikow, wyszukiwanie w bazie wiedzy i inne.

---

## Poradniki

Projekt zawiera kompletne poradniki budowy aplikacji od zera, krok po kroku:

| Faza | Tematyka |
|------|----------|
| [Faza 0](poradniki/Faza_0_Setup_i_Hello_World.md) | Setup projektu, Docker, FastAPI Hello World |
| [Faza 1](poradniki/Faza_1_Zarzadzanie_Uslugami.md) | CRUD uslug — model, repozytorium, schemat, endpoint |
| [Faza 2](poradniki/Faza_2_Zarzadzanie_Zespolem.md) | Zespol — JSON column, upload zdjec, StaticFiles |
| [Faza 3](poradniki/Faza_3_Godziny_Otwarcia_i_Grafik.md) | Grafik pracy — ForeignKey, wyjatki, CASE ordering |
| [Faza 4](poradniki/Faza_4_System_Rezerwacji.md) | Rezerwacje — dostepnosc, konflikty, BackgroundTasks |
| [Faza 5](poradniki/Faza_5_Email_i_Blacklista.md) | Email (Brevo) i czarna lista telefonow/emaili |
| [Faza 6](poradniki/Faza_6_RAG_Baza_Wiedzy.md) | RAG — pgvector, embeddingi, chunking, cosine similarity |
| [Faza 7](poradniki/Faza_7_AI_Agent.md) | Agent AI — OpenAI Agents SDK, function tools, sesje |
| [Faza 8](poradniki/Faza_8_Admin_Panel_i_Auth.md) | Panel admina — HMAC auth, HTTP-only cookies |

---

## Docker

```bash
# Uruchomienie bazy danych
docker-compose up -d

# Zatrzymanie
docker-compose down

# Zatrzymanie i usuniecie danych
docker-compose down -v
```

---

## Autor

Stworzone dla Salonu Fryzjerskiego - Szymon
