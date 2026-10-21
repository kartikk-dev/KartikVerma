
# Kartik Verma | Full Stack Engineering Portfolio

A personal portfolio showcasing my approach to full-stack engineering, responsive interface design, backend systems, APIs, databases, and digital product development.

## About

I am Kartik Verma, a full-stack engineer interested in building useful digital products through thoughtful design and practical engineering.

This portfolio brings together my selected projects, technology stack, engineering approach, technical writing, and contact information.

## Featured Projects

- **Serviq:** A field-service management concept focused on work orders, operations, and workflow visibility.
- **MovieFlex:** A movie discovery experience focused on browsing and exploring films.
- **AI Business Intelligence:** An analytics concept for exploring business information through visual summaries.

## Portfolio Features

- Responsive layouts for desktop and mobile.
- Interactive engineering and technology sections.
- Project previews and selected work.
- Blog and technical writing section.
- Contact links for collaboration.
- Review submission interface with moderation support, when configured.

## Technology

The portfolio uses Astro, TypeScript, HTML, CSS, and JavaScript. Supabase can be used for the portfolio review workflow when the required environment configuration and database policies are set up.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run Astro diagnostics:

```bash
npm run check
```

Build the production site:

```bash
npm run build
```

## Environment Variables

Create a local `.env` file for development when required.

Never commit `.env` files, private API keys, service-role keys, passwords, or access tokens. Configure deployment environment variables through the hosting provider's environment settings.

Variables prefixed with `PUBLIC_` may be exposed to browser code. Never use that prefix for private credentials.

## Deployment

This project can be deployed to Vercel using the GitHub repository integration.

For a standard static Astro build, the output directory is `dist`. Configure any required environment variables in Vercel before deploying features that depend on external services.

## Security

Do not commit secrets or local diagnostic files. Review Git changes before committing or pushing, and use appropriate database access policies for any public-facing submission forms.

## License

Unless a separate license is added to this repository, the source code is not automatically granted an open-source license.
