- [ ] Use Better certificate.
- [ ] Service workers improve serving cache.
- [ ] Update Help Section ( Can be done after the report is completed)
- [ ] Detect Tonic and Use original tonic
- [ ] Debug tonic

For webworker with insecure certificates.
google-chrome --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure=https://0.0.0.0:5000 --user-data-dir=/tmp/foo  

USE_SERVICE_WORKER in base.html
USE_DB_CACHE in index.js
DEBUG in init
CLEANUP

run scripts/prepare.py in that order
cd Data and run updateIndex.py
cd web and run python3 run.py


current task

Deploy the project locally using wsgi
Deploy the project on Remote server 
Send it to ma'am and ask for review with the todo list.
Due to some issue the realtime plot doesn't work on the mobile phones (issue mainly due to low priority threads).

Todo: make graph based on current time, don't plot recorded pitch curve on the mobile devices
