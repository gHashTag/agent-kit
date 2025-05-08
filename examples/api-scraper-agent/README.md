# API Scraper Agent

This agent is designed to parse API files from various API scrapers.

## Features

- API token authentication
- Configurable scrape limits
- TypeScript support

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and fill in your API credentials.

## Usage

```typescript
import { ApiScraper } from "./src/index";

const scraper = new ApiScraper(process.env.API_TOKEN);
// Add your scraping logic here
```

## Testing

Run tests with:

```bash
npm test
```
