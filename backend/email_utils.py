import os 
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from pathlib import Path 

dotenv_path = Path(__file__).resolve().parent.parent / 'backend' / '.env'
load_dotenv(dotenv_path=dotenv_path)

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("email_port" , 587))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD") 
EMAIL_FROM = os.getenv("EMAIL_FROM") 

def send_verification_email(to_email: str, verification_link: str):
    if not all([EMAIL_HOST,EMAIL_USERNAME,EMAIL_PASSWORD,EMAIL_FROM]):
        print("Email sending configration misisng. Skiping email")
        return
    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM
    msg['To'] = to_email
    msg['Subject'] = "Verify your college blog account"

    body = f"""
    hello ,
    thank you for registering to my {to_email} !
    Please click on the link below to verify your email address:
    {verification_link}
    If you did not register for this account, please ignore this email.
    Best regards,
    Maker of this website 
    """
    msg.attach(MIMEText(body,'plain'))
    try:
        with smtplib.SMTP(EMAIL_HOST,EMAIL_PORT)as server:
            server.starttls()
            server.login(EMAIL_USERNAME,EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"Verfication email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send verification email to {to_email}: {e}")