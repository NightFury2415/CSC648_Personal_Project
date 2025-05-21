import boto3
from botocore.exceptions import ClientError
import os

def test_ses_setup():
    """
    Test if AWS SES is properly configured
    """
    # Initialize SES client
    aws_region = os.getenv("AWS_REGION", "us-west-1")
    ses_client = boto3.client('ses', region_name=aws_region)
    
    # Test email configuration
    sender = os.getenv("SES_FROM_EMAIL", "noreply@gator.market")
    recipient = "dmoguy@gmail.com"  # Replace with your test email
    
    try:
        # Send a test email
        response = ses_client.send_email(
            Source=sender,
            Destination={'ToAddresses': [recipient]},
            Message={
                'Subject': {'Data': 'AWS SES Test Email'},
                'Body': {
                    'Text': {'Data': 'This is a test email from AWS SES.'},
                    'Html': {'Data': '<h1>Test Email</h1><p>This is a test email from AWS SES.</p>'}
                }
            }
        )
        print(f"Test email sent successfully! Message ID: {response['MessageId']}")
        return True
    except ClientError as e:
        print(f"Error: {e.response['Error']['Message']}")
        if e.response['Error']['Code'] == 'MessageRejected':
            print("Email address might not be verified or you're still in sandbox mode")
        elif e.response['Error']['Code'] == 'AccessDenied':
            print("Check your IAM permissions")
        return False

if __name__ == "__main__":
    test_ses_setup()