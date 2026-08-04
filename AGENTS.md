<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deploy

This is the www.parvomaps.us site. Deploy ground truth:

- **Auto-deploys on git push** — `git push` to the `github-parvomap` SSH-alias remote → GitHub → Vercel builds and deploys to www.parvomaps.us automatically. No CLI deploy step needed; just commit and push.
- **Contrast with newsletter-site (aiwithizic.com):** that project does the OPPOSITE — it does NOT auto-deploy on push and requires a manual `vercel --prod` CLI deploy. Don't assume the two behave the same; they don't.
