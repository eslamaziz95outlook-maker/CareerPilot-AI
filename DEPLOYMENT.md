# Deployment Guide

## Create and push a GitHub repository

After installing Git and creating an empty GitHub repository, run these commands from the project folder. Replace `YOUR_GITHUB_USERNAME`.

```bash
git init
git add .gitignore .env.example README.md DEVPOST_SUBMISSION.md VIDEO_SCRIPT.md DEPLOYMENT.md FINAL_CHECKLIST.md package.json pnpm-lock.yaml pnpm-workspace.yaml next.config.ts postcss.config.mjs eslint.config.mjs tsconfig.json src public
git status
git commit -m "Prepare CareerPilot AI hackathon submission"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/careerpilot-ai.git
git push -u origin main
```

Before committing, verify that `git status` does not include `.env.local`, `.next`, `node_modules`, or `.devserver*.log`.

## Deploy on Vercel

1. Open [vercel.com/new](https://vercel.com/new) and import the GitHub repository.
2. Keep the Next.js preset and default build command: `pnpm build`.
3. Add these environment variables:

   ```env
   OPENAI_API_KEY=
   ENABLE_LIVE_AI=false
   ```

   The API key may remain blank for judging. Do not add a real key in Demo Mode.
4. Deploy and open the Vercel URL.

## Verify after deployment

1. Confirm the homepage loads over HTTPS.
2. Load Demo Candidate and analyze a Dammam Construction Manager description.
3. Confirm **Demo Analysis**, Dammam extraction, three evidence groups, weighted score, and PMP match.
4. Confirm Arabic uses RTL layout.
5. Upload a temporary PNG or PDF, preview it, close it, reload, and confirm IndexedDB persistence.
6. Confirm network activity contains no OpenAI request in Demo Mode.

## Optional future live mode

Only after billing, privacy, and rate-control review, set a server-side `OPENAI_API_KEY` and `ENABLE_LIVE_AI=true`. Never expose the key to the client, repository, logs, video, or Devpost.
