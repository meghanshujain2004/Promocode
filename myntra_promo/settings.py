import os
from pathlib import Path
import dj_database_url

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-myntra-promo-offer-key-secret')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'offers',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myntra_promo.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'myntra_promo.wsgi.application'

# ----------------------------------------------------------------------
# DATABASE CONFIGURATION (Render DATABASE_URL / MySQL / SQLite Fallback)
# ----------------------------------------------------------------------
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
    print("[DATABASE INFO] Using Render Database from environment variable DATABASE_URL")
else:
    MYSQL_DB_CONFIG = {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('MYSQLDATABASE', 'myntra_offers_db'),
        'USER': os.environ.get('MYSQLUSER', 'root'),
        'PASSWORD': os.environ.get('MYSQLPASSWORD', 'Admin1223'),
        'HOST': os.environ.get('MYSQLHOST', '127.0.0.1'),
        'PORT': os.environ.get('MYSQLPORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
        }
    }

    try:
        import pymysql
        conn = pymysql.connect(
            host=MYSQL_DB_CONFIG['HOST'],
            user=MYSQL_DB_CONFIG['USER'],
            password=MYSQL_DB_CONFIG['PASSWORD'],
            port=int(MYSQL_DB_CONFIG['PORT']),
            connect_timeout=2
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DB_CONFIG['NAME']} CHARACTER SET utf8mb4;")
        conn.close()
        
        DATABASES = {
            'default': MYSQL_DB_CONFIG
        }
        print("[DATABASE INFO] Connected successfully to MySQL Database: myntra_offers_db")
    except Exception as e:
        print(f"[DATABASE WARNING] Could not connect to MySQL server ({e}). Falling back to SQLite database.")
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static Files
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
