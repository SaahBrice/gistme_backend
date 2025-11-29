import firebase_admin
from firebase_admin import messaging
print(f"Firebase Admin Version: {firebase_admin.__version__}")
print("Messaging attributes:")
print(dir(messaging))
