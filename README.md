# 🏦 Bank QA Environment Simulator (Full-Stack)

Entorno de pruebas y simulación Full-Stack para sistemas de transferencias internacionales bancarias. Diseñado específicamente para poner a prueba estrategias de calidad (QA), desarrollo guiado por comportamiento y arquitecturas limpias.

---

## 🚀 Arquitectura Tecnológica

El proyecto está dividido en dos grandes bloques desacoplados, simulando un entorno de microservicios moderno:

### 1. Backend (Python + FastAPI)
- **Framework:** FastAPI
- **Base de Datos:** SQLite (local persistente)
- **ORM:** SQLAlchemy
- **Seguridad:** Autenticación por Tokens JWT (JSON Web Tokens) y contraseñas cifradas (Bcrypt).
- **Lógica de Negocio:**
  - Creación de usuarios con asignación automática de IBAN.
  - Validación estricta de transferencias (Países autorizados, fondos suficientes).
  - Reglas de *Compliance* (Bloqueo antiblanqueo superior a 10.000€).

### 2. Frontend (React + TypeScript)
- **Framework:** React 19 + Vite.
- **Tipado Estricto:** TypeScript (Interfaces y Tipos para peticiones HTTP).
- **Estilos:** Tailwind CSS v4.
- **Cliente HTTP:** Axios con inyección de JWT.
- **Flujo E2E:** 
  - Login y Registro integrados.
  - Dashboard bancario en tiempo real conectado al backend.

### 3. QA Automation (Cypress)
- **Framework:** Cypress V13.
- **Estrategia:** Pruebas Híbridas (API + UI). Los tests no pierden tiempo en la UI de Login, inyectan el JWT consultando la API en el `beforeEach` y validan directamente el *Dashboard* en React.
- **Reportería:** `cypress-mochawesome-reporter` (Genera un HTML interactivo con gráficos, trazas y capturas automáticas ante fallos).

---

## 🛠️ Cómo arrancar el proyecto localmente

Para ejecutar el entorno completo, abre **tres terminales** distintas en tu sistema:

### Terminal 1: Arrancar el Backend (API)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
> *(La base de datos `banco.db` se generará automáticamente)*

### Terminal 2: Arrancar el Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
> *(Visita la URL que te proporciona Vite, habitualmente `http://localhost:5173/`, para interactuar manualmente con el aplicativo).*

### Terminal 3: Lanzar Pruebas (Cypress)
Una vez levantados Frontend y Backend, puedes correr las baterías de pruebas automatizadas:

Para abrir la **interfaz visual interactiva** de Cypress:
```bash
cd frontend
npm run cy:headed
```

Para correr las **pruebas en consola** (modo Headless / CI) y generar el **informe en HTML**:
```bash
cd frontend
npm test
```
> *(Encontrarás el reporte en `frontend/cypress/reports/index.html`)*

---

## 🎯 Criterios de Aceptación (Casos de Uso a Testear)

El sistema evalúa actualmente 4 flujos principales (`transferencias.cy.js`):
1. **TC-01:** Ejecutar una transferencia internacional válida a un país permitido (FR, DE, IT).
2. **TC-02:** Rechazar operación por falta de fondos.
3. **TC-03:** Bloqueo legal de Compliance (El importe no puede superar los 10.000€, regla que se aplica en backend antes de validar el saldo).
4. **TC-04:** Rechazo de IBAN por país no autorizado (Ej: Intento de transferencia nacional 'ES' en el módulo internacional).

---
*Diseñado para auditorías de código, prácticas de Shift-Left Testing y validación de calidad continua.*
