# Google OAuth Setup Guide

This guide will walk you through the process of setting up Google OAuth credentials and updating your backend configuration, allowing your users to authenticate using their Google accounts.

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your Google account.
3. Click on the project drop-down at the top left and select **New Project**.
4. Enter a name for your project (e.g., `MyApp-Auth`) and click **Create**.

## 2. Configure the OAuth Consent Screen

The OAuth Consent Screen is what your users will see when they attempt to sign in using Google.

1. In the Google Cloud Console, ensure your new project is selected.
2. From the navigation menu (hamburger icon), navigate to **APIs & Services > OAuth consent screen**.
3. Select **External** (unless your app is strictly for internal G-Suite users) and click **Create**.
4. Fill in the required fields:
   * **App name**: Your application's name.
   * **User support email**: Your email address or a dedicated support email.
   * **Developer contact information**: Your email address.
5. Click **Save and Continue**.
6. On the **Scopes** page, click **Add or Remove Scopes**.
7. Select the following non-sensitive scopes:
   * `.../auth/userinfo.email`
   * `.../auth/userinfo.profile`
   * `openid`
8. Click **Save and Continue**.
9. (Optional) If you selected "External" and your app is in "Testing" mode, you must add "Test Users" who are allowed to authenticate.
10. Click **Save and Continue**, then review your settings and return to the dashboard.

## 3. Create OAuth 2.0 Credentials

Now you need to generate the Client ID and Client Secret for your application.

1. Navigate to **APIs & Services > Credentials**.
2. Click on **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
3. Select **Web application** as the Application type.
4. Name your OAuth client (e.g., `Backend Server`).
5. Under **Authorized JavaScript origins**, click **+ ADD URI**. Add your frontend and backend root URLs (e.g., `http://localhost:3000`, `http://localhost:5173`).
6. Under **Authorized redirect URIs**, click **+ ADD URI**. This **must match exactly** what is configured in your `.env` file under `GOOGLE_CALLBACK_URL`. For local development, this is:
   ```
   http://localhost:3000/api/v1/auth/google/callback
   ```
   *(Note: Adjust the port `3000` if your server runs on a different port).*
7. Click **Create**.
8. A modal will appear displaying your **Client ID** and **Client Secret**. Keep this window open or copy these values securely.

## 4. Configure Your Backend App

Now, plug these credentials into your environment variables.

1. Copy `.env.example` to a new file named `.env` if you haven't already.
2. Open the `.env` file.
3. Locate the "Google OAuth" section.
4. Update the values with the credentials you generated:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET

# The route Google will redirect to after successful authentication
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Where the backend should redirect the user (with tokens attached) after successful login
FRONTEND_URL=http://localhost:5173/auth/google/callback
```

## 5. Frontend Integration

Your frontend needs a button or link that directs the user to your backend to start the OAuth flow.

```html
<a href="http://localhost:3000/api/v1/auth/google">Login with Google</a>
```

Once Google authenticates the user, it redirects to the `GOOGLE_CALLBACK_URL` on your backend. Your backend then processes the user (creating a record or retrieving an existing one), generates JWT tokens, and redirects the browser back to `FRONTEND_URL`, appending the tokens in the query string:

`http://localhost:5173/auth/google/callback?accessToken=ey...&refreshToken=ey...&user=123...`

Your frontend is responsible for capturing these tokens from the URL and storing them appropriately (e.g., in memory or local storage).

## 6. Going to Production

When you deploy your application to production:

1. Go back to the **Google Cloud Console > APIs & Services > Credentials**.
2. Edit your OAuth Client.
3. Add your production domain to the **Authorized JavaScript origins** (e.g., `https://api.yourdomain.com`).
4. Add your production callback URL to the **Authorized redirect URIs** (e.g., `https://api.yourdomain.com/api/v1/auth/google/callback`).
5. Update your production server's `.env` to reflect the new Production URLs.
6. Under **OAuth consent screen**, make sure to Publish your app when you are ready to allow any user to sign in.
