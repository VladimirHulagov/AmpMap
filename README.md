# TestY TMS
___
TestY is an open source project developed by KNS Group LLC (YADRO) as an alternative to other test managements systems.  
Project is lightweight and uses django-rest-framework as core for its backend.
### Docker deployment
1. Create .env file, you can find example with comments in repository *.env.template*
2. docker-compose up: starts dev version of TestY
   1. DB runs on port 5435
   2. TestY backend runs on port 8001
   3. TestY frontend runs on port 3007
   4. Plugins page runs on backend only and doesn't have native ui.
3. For production deployment setting up nginx is recommended, frontend will not be launched via npm.

*For development purposes and local deployment and debugging check CONTRIBUTION.md*

