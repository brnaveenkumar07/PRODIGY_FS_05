# Social App

A full-stack social networking application built with Next.js, React, Prisma, and PostgreSQL. Users can create accounts, publish posts, upload media, explore trending content, follow other users, and receive real-time-style in-app notifications for activity across the platform.

This project is structured as a modern App Router application and is suitable as a portfolio project, learning resource, or foundation for a larger social platform.

## Overview

Social App focuses on the core interactions expected in a modern community product:

- User authentication with registration and login
- Public feed with post creation
- Likes, comments, and follow relationships
- Trending posts and hashtags
- User profiles with editable profile details
- Notification center for likes, comments, and follows
- Media uploads with local storage support and Vercel Blob support

## Key Features

### Authentication

- Email/password registration and login
- Password hashing with `bcryptjs`
- Session handling with signed tokens

### Social Features

- Create text posts
- Attach media to posts
- Like and comment on posts
- Follow and unfollow users
- View user profiles
- Browse posts by tag

### Discovery

- Explore page for trending posts
- Trending tags from recent activity
- Personalized feed layout

### Notifications

- Notifications for follows
- Notifications for likes
- Notifications for comments
- Mark individual notifications as read
- Mark all notifications as read

### Profile Management

- Update display name
- Add bio, website, and location
- Avatar fallback using user initials

## Tech Stack

- Framework: Next.js 16
- UI: React 19
- Language: TypeScript
- Styling: Tailwind CSS 4
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod + React Hook Form
- Authentication utilities: `jose`, `bcryptjs`
- File uploads: Vercel Blob with local fallback
- UI primitives: Base UI / shadcn-style component setup

## Project Structure

```text
src/
  app/                 App Router pages and API routes
  components/          Shared UI and feature components
  hooks/               Custom React hooks
  lib/                 Utilities, auth, validation, Prisma client
prisma/
  schema.prisma        Database schema
  seed.ts              Seed script with demo data
public/
  uploads/             Local development uploads
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

If you are on Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

Then update the values with your actual credentials.

### 3. Prepare the database

For a fresh local setup, run one of the following:

```bash
npm run db:push
```

or, if you want to create and track migrations during development:

```bash
npm run db:migrate
```

### 4. Seed demo data (optional)

```bash
npm run db:seed
```

This creates demo users, posts, tags, likes, comments, and follow relationships.

### 5. Start the development server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Environment Variables

The following variables are required for local development and deployment:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Yes | Secret used to sign and verify authenticated sessions |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob token for cloud media uploads |

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma client and build the app |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma development migrations |
| `npm run db:push` | Push schema changes without creating a migration |
| `npm run db:seed` | Seed the database with demo data |
| `npm run db:studio` | Open Prisma Studio |

## Demo Accounts

If you seed the database, you can log in with the following demo users:

- `alice@example.com`
- `bob@example.com`
- `charlie@example.com`

Password for all demo accounts:

```text
password123
```

## File Upload Behavior

The application supports two upload modes:

- If `BLOB_READ_WRITE_TOKEN` is configured, uploads are stored in Vercel Blob and public URLs are saved with posts.
- If the token is not configured, local development falls back to `public/uploads`.

The upload route currently supports common image and video types, with a maximum file size of 20 MB.

## Deployment Notes

This project is ready to deploy on platforms such as Vercel.

Before deploying:

1. Add `DATABASE_URL` to your deployment environment.
2. Add `JWT_SECRET` to your deployment environment.
3. Add `BLOB_READ_WRITE_TOKEN` if you want cloud-based uploads.
4. Ensure your PostgreSQL database is reachable from the deployment environment.

Additional deployment details:

- Prisma client generation runs automatically during install via `postinstall`.
- The production build also regenerates the Prisma client before building Next.js.
- Blob storage is optional, but recommended for production media handling.

## Database Models

The core data model includes:

- `User`
- `Profile`
- `Post`
- `Tag`
- `PostTag`
- `Like`
- `Comment`
- `Follow`
- `Notification`

Notification types supported by the schema:

- `LIKE`
- `COMMENT`
- `FOLLOW`

## Use Cases

This repository is a good fit for:

- Learning full-stack development with Next.js App Router
- Understanding Prisma relationships in a social product domain
- Building a portfolio-ready social media clone
- Extending a starter into a larger community platform

## Future Improvements

Possible next enhancements include:

- Image optimization and media previews
- Better feed ranking and pagination
- Search across users and posts
- Direct messaging
- Rich notifications or real-time updates
- Automated tests and CI workflows

## License

This project is available for educational and portfolio use. Add a formal license if you plan to distribute or open-source it publicly.

Live Demo: https://social-app-naveen.vercel.app/
