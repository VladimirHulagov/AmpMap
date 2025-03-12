# TestY TMS
TestY is a Test Management System developed by [KNS Group LLC (YADRO)](https://yadro.com) since 2022 and 
published in 2023 as an open source project under AGPLv3 license.

<br />

## Introduction
___

**TestY is lightweight and uses following technologies and frameworks:**
* Django for backend
* ReactJS for frontend
* PostgreSQL &ndash; database server

*<u>Note: the list above contains not all but the key items only</u>*

**TestY is based on classic approaches of TMS:**
* All tests and related stuff separated into projects
* Test cases grouped by suites for any deep nesting
* Test Plans collect Test Cases as Tests and it can be parametrized
* A Test can have none, one or more results of test execution. For test cases based on steps every step has own status
* Statistics reports consider only recent results of a test plan

**TestY highlights:**
* Responsive and intuitive user interface
* Every key entity (Test Case, Test, Test Plan, Test Result) can be extended by custom attributes with following type: 
text, list, json
* Private projects for limited access of users
* History of test cases changes 
* Labels for test cases that allow to filter tests in test plans for getting of result slices
* Markdown editor for all text fields
* Comments for Test Cases, Test Results
* Charts and statistics for Tests estimates
* Installation includes 3 plugins: import from TestRail, import from Allure report and import from CSV files
* Public REST API for integrations
* Docker compose configuration distribution
* User interface localization for Russian language

<br />

## Getting started
___
### Requirements and preconditions

* Make sure that you have installed and running docker
  * For Windows users TestY requires running Docker Desktop with WSL2 support
* Installed OpenSSL library for your Linux (WSL2) installation to generate self signed SSL certificates 
* Download Testy release from official repository https://gitlab-pub.yadro.com/testy/testy/ and unzip it
   * The alternative way: clone the repository and then switch branch to chosed version by appropriate git command
* Remove docker images and volumes for previous TestY version (for **Development deployment** only) 

*<u>Note: if you are a newbie for TestY we suggest to use **Development deployment** to set up and run TestY locally 
to evaluate it: see the section below.</u>*    

 
### Production installation

1. Go to `{project_root}/nginx` directory and run `make_ssl.sh` to create self-signed ssl certificates.
    * Make sure that certificate files found in the directory
2. Copy `.env.template` to `.env`
3. Change the default values for variables in `.env`:
    * *SECRET_KEY* to your randomized string
    * *SUPERUSER_USERNAME* to your TestY Administrator login
    * *SUPERUSER_PASSWORD* to password of TestY Administrator    
    * *VITE_APP_API_ROOT* to TestY url: 
        * if plan to use FQDN as TestY hostname write it here (e.g. https://testy.mycompany.ru). 
        Otherwise, set IP address (e.g. https://100.99.88.77)
4. Run `sudo docker-compose up` (or `docker-compose up` under root user if sudo not supported 
nor installed in your system)
    * if you run under Windows/WSL2 and got the error like `entrypoint.sh: no such file or directory` 
    please check section **Known issues** below.  
5.  Wait until all TestY containers are up:
```
$ sudo docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
NAMES             PORTS                                      STATUS
nginx             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp   Up ## seconds
notifications                                                Up ## seconds
testy             0.0.0.0:8001->8000/tcp                     Up ## seconds
testy_celery                                                 Up ## seconds (healthy)
testy_pgbouncer   0.0.0.0:5436->5432/tcp                     Up ## seconds (healthy)
testy_db          0.0.0.0:5435->5432/tcp                     Up ## seconds (healthy)
testy_redis       0.0.0.0:6380->6379/tcp                     Up ## seconds (healthy)
```
*<u>Note: the container `testy-frontend` exits in a few seconds. It is the expected behavior. 
The container just builds the frontend as static JS file for nginx.</u>* 

6. Open URL defined in `.env` in *VITE_APP_API_ROOT* and log in by credentials 
defined in *SUPERUSER_USERNAME, SUPERUSER_PASSWORD*. 

   
#### Tips and trips

* Use regular (not self signed) SSL certificates
* Change *VOLUMES_PATH* for some other path than root, because every hard redeployment or local repository removing
   will delete your volumes information
* Do not use default settings for database
* Do not leave Administrator creds as it is
* Set server name for nginx configuration by *HOST_NAME* variable in `.env` file
* If you would like to `docker compose up` under regular (not root) user you need to add your 
user id as UID environment variable, by default we are using user with id 0 (which is root or default user)
* Change *VITE_APP_REPO_URL, VITE_APP_BUG_REPORT_URL* in `.env` to point out to your URLs if you forked TestY 
and made changes

### Development deployment

1. Copy `.env.template` to `.env`
2. Change the default values for variables in `.env`:
    * *VITE_APP_API_ROOT* to http://127.0.0.1
3. Run `sudo docker-compose -f docker-compose-dev.yml up` (or `docker-compose -f docker-compose-dev.yml` 
under root user if sudo not supported nor installed in your system)
    * if you run under Windows/WSL2 and got the error like `entrypoint.sh: no such file or directory` 
    please check section **Known issues** below.  
4. Wait until all TestY containers are up:
```
$ sudo docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
NAMES             PORTS                    STATUS
nginx             0.0.0.0:80->80/tcp       Up ## seconds
notifications                              Up ## seconds
testy_celery                               Up ## seconds (healthy)
testy             0.0.0.0:8001->8000/tcp   Up ## seconds
testy_pgbouncer   0.0.0.0:5436->5432/tcp   Up ## seconds (healthy)
testy-frontend    0.0.0.0:3000->3000/tcp   Up ## seconds
testy_db          0.0.0.0:5435->5432/tcp   Up ## seconds (healthy)
testy_redis       0.0.0.0:6380->6379/tcp   Up ## seconds (healthy)
```
5. Open URL http://127.0.0.1 (not HTTPS!) and log in by credentials defined in `.env`: 
*SUPERUSER_USERNAME, SUPERUSER_PASSWORD*

<br />

## Documentation
___
The documentation for TestY is still in progress therefore you can use 
[this article](https://habr.com/ru/companies/yadro/articles/881714/) to khow the system better.
For non-russian users we suggest to use Google, Yandex translate services 
or AI (LLM) chatbots.
   

### Upgrade

<span style="color:red;">*<u>Note: before any upgrade please always back up database and attachments!</u>*</span>

TestY supports two ways of upgrade procedure:
* Upgrade from latest version of 1.x versions: 1.3.4 -> *LATEST* 
* Upgrade from any previous version for same minor releases, for now it is 2.0.X -> *LATEST*

Other upgrade configurations may work but not tested by TestY Team.

Downgrade procedure is not supported. 

After successful upgrade the browser may have an outdated local data. Please clean up the browser local storage. 
<br />

### REST API
The API documentation provided by [Django REST framework](https://www.django-rest-framework.org/) 
and can be found by URL: <br />
*VITE_APP_API_ROOT*/api/v2/swagger/

<br />

## Known issues
___
* Repository clone under Windows by git or in IDE may convert the line ending separator from LF to CRLF. 
It breaks `/backend/testy/scripts/entrypoint.sh` and `testy` container exits with non-obvious error 
`entrypoint.sh: no such file or directory`. Please revert CRLF back to LF.

<br />

## FAQ
___
<u>Question:</u> I open the page and try to log in but got *Login Failed* message<br />
<u>Answer:</u> Make sure that you open same URL as you defined for *VITE_APP_API_ROOT* in `.env` file. 

<u>Question:</u> What's about the load and limits?<br />
<u>Answer:</u> The system successfully tested for tens of thousands of cases and suites, hundreds of thousands of tests, 
millions test results, hundreds users. 

<u>Question:</u> What server or VM configuration you suggest for a production environment?<br />
<u>Answer:</u> 4 cores and 16GB RAM is minimal, 8 cores and 32GB RAM is recommended. 
Storage very depends on how many (and large) files you plan to store as attachments 
but anyway better to use SSD/NVMe storage type due to performance reasons.

<u>Question:</u> How to use LDAP authentication for TestY?<br />
<u>Answer:</u> Install `django-auth-ldap` and follow the manual 
[Django Authentication Using LDAP](https://django-auth-ldap.readthedocs.io/en/latest/).  

<br />

## Contribution
___
For contribution check out 
[the rules](https://gitlab-pub.yadro.com/testy/testy/-/blob/main/CONTRIBUTING.md).

<br />

## Contacts
___
Please send a message [testy@yadro.com](mailto:testy@yadro.com) if you would like 
* to tell any feedback about TestY
* to (un)subscribe on a mail list where we announce new releases (usually monthly or even less often)

<br />

## License
This project is licensed under the terms of the 
[AGPLv3 license](https://gitlab-pub.yadro.com/testy/testy/-/blob/main/LICENSE).