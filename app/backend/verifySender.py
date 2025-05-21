import boto3
import time

ses = boto3.client('ses', region_name='us-west-1')

# Emails to verify
emails_to_verify = [
    'noreply@csc648g1.me',  # Your sender
    'dmoguy@gmail.com'       # Your test recipient
]

for email in emails_to_verify:
    try:
        # Send verification
        ses.verify_email_identity(EmailAddress=email)
        print(f"✓ Verification email sent to: {email}")
    except Exception as e:
        print(f"✗ Error with {email}: {e}")

print("\n📧 Check both email inboxes and click the verification links!")
print("After clicking the links, wait about 30 seconds, then run testSES.py")