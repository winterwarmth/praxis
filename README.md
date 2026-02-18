# Praxis - Campus Marketplace

CSC4350 Group 14 Project

## Team Members
- Soo: https://github.com/canopyfox
- Edgar: https://github.com/Ramireedgar
- Hui: https://github.com/Bui-DucHUY

## Tech Stack

### Frontend
- Angular 21.1.2
- Node.js 24 LTS

### Backend
- ASP.NET Core Web API (.NET 10)
- Entity Framework Core
- ASP.NET Core Identity (Authentication)
- PostgreSQL

## Prerequisites

- Node.js 24.x LTS (use mise preferably to install node.js and .NET runtimes)
- .NET 10 SDK
- PostgreSQL 18
- Git
- EF Core Tools: `dotnet tool install --global dotnet-ef`

## Setup Instructions

### 1. Clone the repository
```bash
git clone git@github.com:winterwarmth/praxis.git
cd praxis
```

### 2. Install tools with mise (optional)
```bash
mise install
```

### 3. Setup Frontend (Angular)
```bash
cd client
npm install
npm start
```
Frontend runs at: http://localhost:4200

### 4. Setup Backend (ASP.NET)
```bash
cd api
dotnet restore
dotnet run
```
API runs at: http://localhost:5000

### 5. Setup Database (PostgreSQL)
- Install PostgreSQL or use Docker
- Create database: `praxis_dev`
- Update connection string in `api/appsettings.Development.json`
- Run migrations: `dotnet ef database update`

## Development Workflow

### Creating a new feature
```bash
git checkout -b feature/your-feature-name
# Make changes
git add .
git commit -m "Add your feature"
git push origin feature/your-feature-name
# Create Pull Request on GitHub
```

## Project Structure

```
praxis/
├── client/          # Angular frontend
│   ├── src/app/
│   │   ├── core/       # Singletons (guards, interceptors, services)
│   │   ├── features/   # Business logic modules
│   │   ├── pages/      # Route components
│   │   └── shared/     # Reusable UI components
│   └── package.json
├── api/             # ASP.NET Core backend
│   ├── Controllers/
│   ├── Program.cs
│   └── PraxisApi.csproj
└── README.md
```
