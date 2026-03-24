# Social App

## Getting Started

Install dependencies, create a local `.env` from `.env.example`, and start the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment Variables

Set these variables locally and in Vercel:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma
- `JWT_SECRET`: secret used to sign session cookies
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token for file uploads

## Vercel Deployment

This project is now set up to deploy more cleanly on Vercel:

- Prisma client generation runs during install via `postinstall`
- The Next.js TypeScript build no longer checks `prisma/seed.ts`
- Uploaded files are stored in Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured
- Posts can use either local uploads or direct internet image URLs

Before deploying:

1. Add `DATABASE_URL` in your Vercel project environment variables.
2. Add `JWT_SECRET` in your Vercel project environment variables.
3. Add `BLOB_READ_WRITE_TOKEN` in your Vercel project environment variables.
4. Redeploy the project.

Important note about uploads:

When `BLOB_READ_WRITE_TOKEN` is present, uploaded files are stored in Vercel Blob and the returned public URL is saved on the post. Without that token, local development falls back to `public/uploads`.

Live Demo: https://social-app-naveen.vercel.app/
