# BallStreet - NBA Player Stock Market

BallStreet is an innovative platform that allows users to trade virtual shares of NBA players based on their real-world performance. The platform combines real-time NBA statistics, machine learning predictions, and social sentiment analysis to create a dynamic trading environment.

## Features

- Real-time player price updates
- Portfolio management
- Trading functionality
- Performance predictions using ML
- Market insights and sentiment analysis
- WebSocket-based real-time updates

## Tech Stack

- **Backend**: FastAPI, Python
- **Frontend**: React, TailwindCSS
- **Database**: PostgreSQL
- **ML**: TensorFlow, scikit-learn
- **Real-time**: WebSocket
- **Deployment**: Docker, AWS

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL
- Docker (optional)

### Backend Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the backend:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

## Deployment

### Option 1: Docker Deployment

1. Build the Docker images:
```bash
docker-compose build
```

2. Run the containers:
```bash
docker-compose up -d
```

### Option 2: Cloud Deployment

1. Backend (AWS):
   - Deploy to AWS Elastic Beanstalk
   - Set up RDS for PostgreSQL
   - Configure environment variables

2. Frontend (Vercel/Netlify):
   - Connect your GitHub repository
   - Configure build settings
   - Deploy

## API Documentation

Once deployed, access the API documentation at:
- Swagger UI: `https://your-domain/api/docs`
- ReDoc: `https://your-domain/api/redoc`

## Presentation Links

- Live Demo: [https://ballstreet.app](https://ballstreet.app)
- Pitch Deck: [Link to your pitch deck]
- GitHub Repository: [Link to your repository]

## Contact

For investor inquiries:
- Email: [Your email]
- LinkedIn: [Your LinkedIn]
- Phone: [Your phone]

## License

This project is proprietary and confidential. All rights reserved. 