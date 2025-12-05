# PythonAnywhere Deployment Guide for Gist4U

## Step 1: Sign Up & Create Console
1. Go to https://www.pythonanywhere.com
2. Sign up for an account (free tier works for testing)
3. Go to **Consoles** → **Bash** → Start a new console

## Step 2: Clone Repository
```bash
git clone https://github.com/SaahBrice/gistme_backend.git
cd gistme_backend
```

## Step 3: Create Virtual Environment
```bash
mkvirtualenv --python=/usr/bin/python3.12 gistme_env
pip install -r requirements.txt
```

## Step 4: Create .env File
```bash
cp .env.example .env
nano .env
```
Fill in your actual values:
- `YOURUSERNAME` → Your PythonAnywhere username
- `SECRET_KEY` → Generate a new Django secret key
- `FAPSHI_API_KEY/USER` → Your Fapshi credentials
- Email settings → Your Gmail + App Password

## Step 5: Upload Firebase Credentials
1. Go to **Files** tab in PythonAnywhere
2. Upload `serviceAccountKey.json` to `/home/YOURUSERNAME/gistme_backend/`

## Step 6: Initialize Database & Static Files
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser  # Create admin account
```

## Step 7: Configure Web App
1. Go to **Web** tab → **Add a new web app**
2. Choose **Manual configuration** → **Python 3.12**
3. Set these values:
   - **Source code**: `/home/YOURUSERNAME/gistme_backend`
   - **Virtualenv**: `/home/YOURUSERNAME/.virtualenvs/gistme_env`

4. Edit **WSGI configuration file** (click the link):
```python
import os
import sys

# Add project to path
path = '/home/YOURUSERNAME/gistme_backend'
if path not in sys.path:
    sys.path.append(path)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'gistme_backend.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

5. Click **Reload** button

## Step 8: Set Up Auto-Deploy (GitHub Webhook)

### Option A: Scheduled Task (Recommended for Free Tier)
1. Go to **Tasks** tab
2. Create a scheduled task that runs daily:
```bash
cd /home/YOURUSERNAME/gistme_backend && git pull origin master && /home/YOURUSERNAME/.virtualenvs/gistme_env/bin/pip install -r requirements.txt && /home/YOURUSERNAME/.virtualenvs/gistme_env/bin/python manage.py migrate --noinput && /home/YOURUSERNAME/.virtualenvs/gistme_env/bin/python manage.py collectstatic --noinput && touch /var/www/YOURUSERNAME_pythonanywhere_com_wsgi.py
```

### Option B: Webhook (Paid accounts only)
1. Get your API token from **Account** → **API Token**
2. Create a webhook endpoint in your app
3. Add webhook to GitHub repository settings

## Step 9: Verify Deployment
1. Visit `https://YOURUSERNAME.pythonanywhere.com`
2. Check admin at `https://YOURUSERNAME.pythonanywhere.com/admin/`
3. Test subscription flow

## Troubleshooting

### Check Error Logs
- Go to **Web** tab → **Error log** link

### CSRF Token Issues
- Make sure `CSRF_TRUSTED_ORIGINS` includes your domain

### Static Files Not Loading
- Run `collectstatic` again
- Check whitenoise is in MIDDLEWARE

### 500 Errors
- Set `DEBUG=True` temporarily to see actual error
- Check the error log

## Manual Update Process
When you need to update immediately:
```bash
cd ~/gistme_backend
git pull origin master
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
```
Then click **Reload** in the Web tab.
