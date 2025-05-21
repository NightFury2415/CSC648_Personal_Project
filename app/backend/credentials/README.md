# Credentials Folder

## The purpose of this folder is to store all credentials needed to log into your server and databases. This is important for many reasons. But the two most important reasons is
    1. Grading , servers and databases will be logged into to check code and functionality of application. Not changes will be unless directed and coordinated with the team.
    2. Help. If a class TA or class CTO needs to help a team with an issue, this folder will help facilitate this giving the TA or CTO all needed info AND instructions for logging into your team's server. 


# Below is a list of items required. Missing items will causes points to be deducted from multiple milestone submissions.

1. Server URL: csc648g1.me
2. SSH username: ubuntu
3. SSH key: Located in `webServer key.pem` file
4. Database:
   - URL: csc648g1.me
   - Port: 3306
5. Database username: csc648user
6. Database password: Csc648_P@ss!
7. Database name: gator_market

## Access Instructions

1. SSH Access:
for unix systems:
configure your secuirity permissions for the ssh key contained in this folder:
chmod 400 /path/to/csc648-key.pem
ssh -i /path/to/csc648-key.pem ec2-user@csc648g1.me

once you successfully connnect:
// to disable the host
docker-compose down
//to both re-enable and rebuild the server
docker-compose up --build

//note, nginx, mysql-server, node+npm and certbot may need to be installed separately on a new aws instance, this could be automated.
sudo apt-get install certbot nginx mysql-server python3-certbot-nginx npm nodejs



Using PuTTY
PuTTY requires a specific key format. Please follow these configuration steps:

a. Key Conversion:

Launch PuTTYgen
Select "Load" and choose your .pem key file
Select "Save private key" to create a .ppk file

b. Connection Configuration:

Launch PuTTY
Enter "csc648g1.me" in the Host Name field
Navigate to Connection > SSH > Auth > Credentials
Select your converted .ppk file under "Private key file for authentication"
Select "Open" to initiate the connection

Security Considerations:

Never share your private key file
Store the key file in a secure location
Maintain appropriate file permissions
Use only secure network connections

# Most important things to Remember
## These values need to kept update to date throughout the semester. <br>
## <strong>Failure to do so will result it points be deducted from milestone submissions.</strong><br>
## You may store the most of the above in this README.md file. DO NOT Store the SSH key or any keys in this README.md file.
