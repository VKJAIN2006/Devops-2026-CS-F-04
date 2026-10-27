# Docker Deployment Guide - Event Management System

This document outlines how to build, run, and manage the containerized **Event Management System** using Docker and Docker Compose.

---

## 🏛 Architecture Overview

The application is split into three orchestrated container services connected through an internal Docker bridge network (`ems-network`):

| Service | Technology | Internal Port | Host Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **frontend** | React (Vite) + Nginx Alpine | `80` | `3000` | Multi-stage build serving static assets and reverse-proxying `/api/*` to backend |
| **backend** | Node.js Express (Alpine) | `5000` | `5000` | REST API connected to MongoDB, with built-in health checks |
| **mongodb** | MongoDB 7.0 Official | `27017` | `27017` | Persistent NoSQL database with volume persistence |

---

## 🚀 Quick Start

### 1. Start all containers in the background
```bash
docker-compose up -d --build
```

### 2. Verify container status and health
```bash
docker-compose ps
```
You should see all three containers (`ems-mongodb`, `ems-backend`, `ems-frontend`) with status `Up (healthy)`.

### 3. Seed initial admin and organizer accounts
```bash
docker-compose exec backend npm run seed
```
This sets up default credentials:
* **Admin**: `phase4admin@test.com` / `Phase4@123`
* **Organizer**: `phase4organizer@test.com` / `Phase4@123`

### 4. Access the application
* **Web UI (Frontend)**: [http://localhost:3000](http://localhost:3000)
* **Backend API direct**: [http://localhost:5000](http://localhost:5000)
* **API through Nginx Proxy**: [http://localhost:3000/api/events](http://localhost:3000/api/events)

---

## 🛠 Common Management Commands

### View live logs
```bash
# View all services
docker-compose logs -f

# View backend only
docker-compose logs -f backend

# View frontend only
docker-compose logs -f frontend
```

### Stop the application
```bash
docker-compose down
```

### Stop and remove data volumes (Fresh Reset)
```bash
docker-compose down -v
```

### Rebuild an individual service
```bash
docker-compose up -d --build frontend
docker-compose up -d --build backend
```

---

## 📁 Key Files Created

* **`docker-compose.yml`**: Defines orchestration, networking, volumes, environment variables, dependencies, and healthchecks.
* **`Backend/Dockerfile`**: Optimized Node.js 20 Alpine container with production dependencies and health checks.
* **`Backend/.dockerignore`**: Excludes `node_modules`, test files, `.env`, and git history from the build context.
* **`Frontend/Dockerfile`**: Multi-stage build (Vite build $\rightarrow$ Nginx Alpine).
* **`Frontend/nginx.conf`**: Nginx server configuration with SPA routing fallback and `/api/` reverse proxy.
* **`Frontend/.dockerignore`**: Excludes local `node_modules`, `.env`, and git history.
* **`.env.example`**: Reference environment variables for host and containers.
* **`Jenkinsfile`**: Includes automated Docker Compose verification stage.

