#!/bin/sh
exec java -Dserver.port=${PORT} -Dserver.address=0.0.0.0 -jar /app/app.jar
