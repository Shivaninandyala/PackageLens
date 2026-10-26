# PackageLens

**Explore npm packages, compare tools, and discover alternatives.**

PackageLens is a HyperDart component that helps developers explore npm packages using live data from the npm registry.

## Features

### 1. Package Information
Retrieve information about an npm package, including:
- Latest version and description
- Weekly download statistics
- License and latest release date
- Node.js version requirements
- Repository link and deprecation status

### 2. Package Comparison
Compare two or three npm packages using their versions, descriptions, weekly downloads, licenses, release dates, and Node.js requirements where available.

### 3. Package Alternatives
Discover alternative packages for supported libraries. PackageLens fetches current metadata for curated alternatives to packages such as Moment, Axios, Express, and Lodash. For other searches, it uses npm registry search results to find related packages.

## Example Queries

- `npm package info express`
- `Show me the latest version of react`
- `compare react and vue`
- `compare express, fastify and koa`
- `alternatives to moment`
- `packages like axios`

## Technology Stack

- React
- JavaScript
- Vite
- Material UI (MUI)
- npm Registry API
- npm Downloads API

## APIs Used

PackageLens uses public npm APIs:

| Purpose | API |
|---|---|
| Package metadata | `https://registry.npmjs.org/{package}` |
| Latest package metadata | `https://registry.npmjs.org/{package}/latest` |
| Weekly downloads | `https://api.npmjs.org/downloads/point/last-week/{package}` |
| Package search | `https://registry.npmjs.org/-/v1/search` |

Package information and download counts depend on the data returned by npm. Some fields may be unavailable for certain packages.

## Getting Started

### Prerequisites
- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/Shivaninandyala/PackageLens.git
cd PackageLens
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Open the local URL displayed in your terminal, usually `http://localhost:5173/`.

### Production Build

```bash
npm run build
```

## Project Structure

```text
packagelens/
├── src/
│   ├── frontend/
│   │   ├── index.jsx
│   │   └── NewComponent.jsx
│   └── sandbox/
├── hyperdart.config.js
├── resource.json
├── searchData.json
├── package.json
└── README.md
```

## HyperDart Integration

PackageLens is configured as a HyperDart component with query triggers and supported intents for package details, comparisons, and alternatives.

## Limitations

- Alternative suggestions are curated for selected packages; other searches return related npm registry results and may not represent direct substitutes.
- Weekly download statistics and package metadata reflect the available npm API responses.
- Package popularity alone does not determine which library is best for a particular project.

## Repository

[PackageLens on GitHub](https://github.com/Shivaninandyala/PackageLens)
