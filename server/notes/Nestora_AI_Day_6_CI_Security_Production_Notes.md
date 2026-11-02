# Nestora AI — Day 6 Learning Notes
## CI/CD, Repository Security, and Production Configuration Preparation

**Project:** Nestora AI — AI-Powered Furniture Discovery Assistant  
**Day:** 6 of the original 7-day plan  
**Focus:** GitHub Actions CI, first GitHub push, environment-variable safety, backend security review, and production configuration preparation.

> These notes describe the work completed during Day 6. Actual hosting/deployment is still planned for Day 7. Production example URLs are placeholders and are not live endpoints.

---

## 1. Day 6 objectives

The goals were to:

1. Confirm that backend tests and the frontend production build pass.
2. Automate those checks using GitHub Actions.
3. Push the project to GitHub and verify CI.
4. Check that environment files and the Groq API key are protected.
5. Review CORS, request-size limits, and input validation.
6. Prepare environment-variable examples for production deployment.

## 2. Baseline checks

Both checks were run locally and reported as successful.

### Backend tests

Run from the `server` directory:

```bash
npm test
```

**Why:** The backend tests cover product filtering, recommendation behavior, invalid model output, evidence validation, and API failures. Running them locally establishes a baseline before automation.

**Success means:** The command exits successfully. The exact test count depends on the current test files.

### Frontend production build

Run from the `client` directory:

```bash
npm run build
```

**Why:** A Vite production build catches compilation and bundling issues that may not appear while using the development server.

**Success means:** Vite finishes without errors. It does not prove that the live application will work, because production URLs and hosting settings still need to be configured.

---

## 3. GitHub Actions: continuous integration

### What is CI?

Continuous Integration (CI) automatically runs checks when code is pushed or a pull request is opened. It helps detect regressions before changes are merged or shared.

### Workflow location

```text
.github/
└── workflows/
    └── ci.yml
```

GitHub Actions discovers workflow YAML files in `.github/workflows/`.

### Workflow behavior

The workflow has two independent jobs:

- `backend-tests`
- `frontend-build`

It is triggered by pushes and pull requests targeting `main` or `master`. Each job runs on an Ubuntu-hosted runner, checks out the repository, sets up Node.js 22, installs dependencies with `npm ci`, and runs its relevant command.

Backend job commands:

```bash
npm ci
npm test
```

Frontend job commands:

```bash
npm ci
npm run build
```

### Why use `npm ci`?

`npm ci` installs dependencies from the committed lockfile and is designed for repeatable CI installs. It expects a corresponding `package-lock.json`, which is why both files must exist:

```text
server/package-lock.json
client/package-lock.json
```

### Why separate the jobs?

Separate jobs make failures easier to isolate. If the frontend build fails but backend tests pass, the results identify which check needs attention. Jobs can also run independently.

### CI result

The project was pushed to GitHub on the `master` branch. The workflow run showed a green overall checkmark, and both **Backend Tests** and **Frontend Production Build** were confirmed to have green checkmarks.

**This verifies:** The current commit passed the configured backend test command and frontend production build in GitHub Actions.

**It does not verify:** That the app is deployed, that live Groq requests work in production, or that every runtime scenario is covered.

---

## 4. Git repository setup and first push

### Reviewing staged files

The project folders were staged with:

```powershell
git add .github client server
```

The staged changes were reviewed with:

```powershell
git status
git diff --cached --stat
git diff --cached --name-only
```

**Why:** A commit contains staged files. Reviewing them helps prevent accidental inclusion of secrets, local-only files, or generated dependencies.

### Environment-file incident and fix

The staged-file review found that `client/.env` had been staged. It was removed from Git's index without deleting the local file:

```powershell
git rm --cached client/.env
```

The ignore rule was checked with:

```powershell
git check-ignore -v client/.env
```

The output identified the `.env` rule in `client/.gitignore`, confirming that the file was ignored by that rule.

The staged environment-file check was:

```powershell
git diff --cached --name-only | Select-String '(^|/)\.env($|\.)'
```

The intended result is no output for real `.env` files.

**Important:** `git rm --cached` removes a file from Git's index while retaining the local file. If a secret has already been committed or pushed, deleting the file later is not enough; rotate the secret and assess repository history.

### Git push issues resolved

An initial push returned:

```text
error: src refspec master does not match any
```

This can happen when the local branch has no commit yet. The initial commit was created before trying again.

Another attempt returned:

```text
remote: Repository not found.
fatal: repository 'https://github.com/samithsidda/nestora.git/' not found
```

The GitHub repository was then created, the remote URL was set, and the project was pushed. The later successful GitHub Actions run confirms that a commit was pushed and the workflow ran.

### Line-ending warnings

Git displayed warnings that LF line endings would be replaced by CRLF in the Windows working copy. These are common when Git line-ending settings interact with Windows. They were warnings, not test/build failures, and did not prevent CI from passing.

---

## 5. Environment variables and secret protection

### Why environment variables?

Configuration values can differ between local development and production. Secret credentials should not be hardcoded in source code or included in frontend bundles.

### Frontend development configuration

The frontend's local environment file used:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

This points the local React application at the local Express API.

**Important:** Vite exposes variables prefixed with `VITE_` to frontend code. This variable must contain only a public API base URL—not a Groq API key or another secret.

### Backend Groq key

The backend reads the Groq key from an environment variable (the exact name should match the implementation), for example:

```js
process.env.GROQ_API_KEY
```

The actual key belongs in backend environment configuration. It should never be copied into React source code or committed to the repository.

### Ignore rules

The project has separate `.gitignore` files for the client and server. Nested ignore files are valid and can apply rules within their respective directories.

The client ignore rule was verified to exclude `client/.env`. The server environment file should likewise be ignored by `server/.gitignore` if it exists.

Common patterns are:

```gitignore
node_modules/
.env
.env.*
!.env.example
dist/
coverage/
```

Use patterns where appropriate. The `!.env.example` exception allows safe example files to be committed, provided they contain placeholders rather than real secrets.

### CI and API keys

The CI tests mock the Groq SDK, so the automated test job should not need a real Groq key. This allows CI to test validation and failure handling without making real model calls or exposing a secret.

The frontend should call the backend API; the backend should call Groq.

---

## 6. Backend security review

### CORS

The backend allows the development frontend origin:

```text
http://localhost:5173
```

**Purpose:** Cross-Origin Resource Sharing (CORS) controls which browser origins may read responses from the backend.

The local origin is appropriate for development. Before deployment, configure the backend to allow the actual deployed frontend origin. Do not use a placeholder domain as a real production origin.

CORS is a browser access policy; it does not replace authentication, authorization, or server-side validation.

### Request body-size limit

The Express app uses:

```js
express.json({ limit: "10kb" })
```

**Purpose:** Limits JSON request-body size parsed by this middleware and helps avoid unnecessarily large request payloads.

This is not a complete security solution. Depending on the application and hosting setup, rate limiting and other production controls may also be appropriate.

### Input validation

Product and recommendation endpoints validate request input before passing it to services.

**Purpose:** Reject malformed input early, produce predictable errors, and prevent invalid requests from reaching filtering or AI-generation logic.

Validation should cover required fields, types, acceptable ranges, and allowed filter values. Error responses should not expose secrets or unnecessary internal details.

### Error handling

The recommendation endpoint handles failures from the recommendation service and returns an error response rather than treating a failed model call as a successful recommendation.

**Purpose:** AI APIs can fail because of network problems, provider errors, rate limits, or malformed output. Predictable failure handling lets the frontend display a clear message.

The exact production error status and logging policy should be reviewed against the code before deployment.

---

## 7. Production environment examples

The following example files were prepared during Day 6. They document configuration needed for deployment; they are not credentials and do not deploy anything by themselves.

### Frontend production example

File:

```text
client/.env.production.example
```

Example:

```env
VITE_API_BASE_URL=https://your-backend-domain.example/api
```

This is a placeholder only. Replace it with the real deployed backend URL after deployment.

Vite does not automatically load `.env.production.example`; it is a documentation/example file. For a real production build, set `VITE_API_BASE_URL` in the hosting provider's frontend environment settings or in the appropriate production environment file.

### Backend environment example

File:

```text
server/.env.example
```

Example variables:

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
CLIENT_ORIGIN=http://localhost:5173
```

Only include variables that the backend actually uses or that are intentionally planned. The key shown is a placeholder. Never commit a real key.

`CLIENT_ORIGIN` affects CORS only if the backend code reads that variable. Creating the variable alone does not change the current CORS behavior. Connect production configuration to the implementation before deployment.

### Why the final production URL was not set yet

The hosting provider and deployed frontend/backend URLs had not been selected during Day 6. Set the real URLs and production CORS origin on Day 7, after choosing hosting.

---

## 8. Tools and concepts quick reference

| Tool or concept | Why it was used | How it was used |
|---|---|---|
| `npm test` | Check backend correctness | Run locally and in the backend CI job |
| `npm run build` | Check frontend production compilation | Run locally and in the frontend CI job |
| Git | Track project changes | Stage, inspect, commit, and push |
| `.gitignore` | Keep local-only files out of Git | Ignore environment files and dependencies |
| `git check-ignore` | Verify ignore rules | Confirmed the client `.env` matched its ignore rule |
| `git diff --cached` | Inspect what will be committed | Review file names and change summary |
| GitHub repository | Host source code | Push the local `master` branch |
| GitHub Actions | Automate repository checks | Run backend tests and frontend build after push |
| `npm ci` | Reproducible dependency installation | Install from lockfiles in CI |
| Node.js 22 setup action | Select Node.js version in CI | Used in both workflow jobs |
| Environment variables | Separate configuration from source | Frontend API URL and backend Groq key |
| Express CORS | Configure browser-origin access | Reviewed local origin for later production replacement |
| `express.json({ limit: "10kb" })` | Limit JSON request size | Existing backend middleware |
| Input validation | Reject malformed requests early | Reviewed product and recommendation request validation |
| `.env.production.example` | Document frontend production configuration | Added a placeholder backend URL |
| `.env.example` | Document backend configuration safely | Added placeholder variable names/values |

---

## 9. Completion checklist

### Completed on Day 6

- [x] Backend tests passed locally.
- [x] Frontend production build passed locally.
- [x] GitHub Actions workflow created with backend and frontend jobs.
- [x] First commit pushed to GitHub.
- [x] Both CI jobs showed green checkmarks.
- [x] Environment-file and API-key protection checks completed.
- [x] CORS, JSON request-size limit, and input validation reviewed.
- [x] Frontend and backend environment example files prepared.

### Planned for Day 7

- [ ] Select hosting providers.
- [ ] Deploy the Express backend.
- [ ] Configure the real Groq key securely on the backend host.
- [ ] Deploy the React frontend.
- [ ] Set the frontend's real production API base URL.
- [ ] Configure backend CORS for the deployed frontend origin.
- [ ] Run live smoke tests for products, filters, AI recommendations, and error handling.
- [ ] Update the README with real deployment details and setup instructions.
- [ ] Prepare final architecture and interview explanations.

**Do not describe Nestora AI as deployed until the live application has been tested successfully.**

---

## 10. Interview-ready explanation

> “For Nestora AI, I added a GitHub Actions CI workflow with separate jobs for backend tests and frontend production builds. Each job checks out the repository, sets up Node.js, installs dependencies using `npm ci`, and runs the relevant command. Both jobs passed on the pushed commit. I also reviewed environment-variable handling, excluded local environment files from Git, checked the backend's CORS and request validation configuration, and prepared example environment files for deployment. The next step is to deploy the frontend and backend and validate the live integration.”

### Key limitation to explain honestly

CI passing means the configured tests and build passed for that commit. It does not prove production hosting, live Groq requests, or every runtime path is working. Those checks belong to Day 7.

---

## 11. Day 6 summary

Day 6 established an automated quality gate and prepared Nestora AI for deployment. The repository is on GitHub, both CI jobs passed, and the security/configuration review is complete. The application has **not yet been confirmed deployed**; production URLs, provider settings, and live smoke tests remain for Day 7.
