# 🏗️ AI Construction Estimator V2

An AI-powered construction estimation platform that analyzes floor plan images to calculate material quantities, costs, and generates detailed reports. Also supports manual estimation with custom concrete mix ratios.

---

## ✨ Features

###  AI Floor Plan Analysis
- Upload floor plan images (JPG, PNG, JPEG)
- AI-powered room detection and measurement extraction
- EasyOCR for dimension text recognition
- OpenCV image processing and enhancement
- Automatic scale detection and area calculation
- Detailed cost breakdown (Flooring, Painting, Ceiling, Electrical, Plumbing, Doors, Windows)

###  Manual Estimation
- Standard M20, M25, or Custom concrete mix ratios
- Material quantity calculation (Steel, Cement, Sand, Aggregate, Bricks, Paint)
- Custom material rates and wastage percentage
- Detailed report generation with pie charts and material tables

###  Dashboard & Analytics
- Unified dashboard for AI and Manual projects
- Real-time stats (Total Projects, AI vs Manual, Total Cost, Total Area)
- Filter projects by type (AI / Manual)
- Quick upload directly from dashboard

###  Authentication
- JWT-based authentication (python-jose)
- Password hashing with bcrypt via Passlib
- User registration & login
- Role-based access (User/Engineer, Admin)

---

##  Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Web framework |
| **PostgreSQL** | Database |
| **SQLAlchemy** | ORM |
| **Alembic** | Database migrations |
| **EasyOCR** | OCR / Text recognition from images |
| **OpenCV** | Image processing |
| **NumPy** | Numerical computations |
| **python-jose** | JWT token generation |
| **Passlib + bcrypt** | Password hashing |
| **python-dotenv** | Environment variable management |

> **Note:** `re`, `logging`, and `json` are Python built-in modules used for regex, logging, and JSON handling respectively.

### Frontend
| Technology | Purpose |
|------------|---------|
| **React.js** | UI framework (via Vite) |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | UI component library |
| **Framer Motion** | Animations |
| **React Router DOM** | Routing |
| **Recharts** | Charts & visualizations |
| **Axios** | HTTP client |
| **Lucide React** | Icons |

---

##  Getting Started

### Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Git**

---

## Prohject Structure
estimator-v2/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── alembic.ini           # Alembic config
│   ├── app/
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic & AI pipeline
│   │   └── main.py           # FastAPI entry point
│   ├── requirements.txt
│   ├── .env                  # Environment variables
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/       # shadcn/ui + custom components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer (Axios)
│   │   ├── layout/           # Layout components
│   │   └── App.jsx           # Root component
│   ├── tailwind.config.js    # Tailwind CSS config
│   ├── vite.config.js        # Vite config
│   ├── package.json
│   └── .gitignore
│
└── README.md