# Deploying to Google Cloud Run

This application is containerized using Docker and Nginx, making it ready for Google Cloud Run (serverless container platform).

## Prerequisites

1.  A Google Cloud Project with billing enabled.
2.  Your Supabase URL and Anon Key (from your `.env` file).

## Method 1: Using Google Cloud Shell (Recommended)

Since you might not have the `gcloud` CLI installed locally, the easiest way is to use the Cloud Shell in your browser.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the **Activate Cloud Shell** icon (terminal prompt) in the top right.
3.  Upload your project files or clone your repository there.
4.  Run the following commands to build and deploy:

### 1. Enable Services
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### 2. Build the Container
Replace `YOUR_PROJECT_ID` with your actual project ID, and fill in your Supabase keys.

```bash
# Set your project ID
export PROJECT_ID=your-project-id-here

# Submit the build to Cloud Build
gcloud builds submit --tag gcr.io/$PROJECT_ID/horse-betting-ledger \
  --build-arg SUPABASE_URL="https://your-url.supabase.co" \
  --build-arg SUPABASE_ANON_KEY="your-anon-key" .
```

### 3. Deploy to Cloud Run
```bash
gcloud run deploy horse-betting-ledger \
  --image gcr.io/$PROJECT_ID/horse-betting-ledger \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

After this, you will get a URL (e.g., `https://horse-betting-ledger-xyz-uc.a.run.app`) where your app is live.

## Method 2: Local Deployment (If gcloud is installed)

If you install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) locally:

1.  Initialize gcloud:
    ```bash
    gcloud init
    ```
2.  Run the same build and deploy commands as above.
