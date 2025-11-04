# Firebase Service Account Setup

To enable Firebase Admin SDK functionality, you need to:

1. Go to your Firebase Console
2. Navigate to Project Settings > Service Accounts
3. Generate a new private key
4. Download the JSON file
5. Rename it to `firebase-service-account.json`
6. Place it in this directory (src/main/resources)

**Important Security Notes:**
- Never commit this file to version control
- The .gitignore should exclude this file
- In production, use environment variables instead

The file should look like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xyz@your-project-id.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```