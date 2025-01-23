FROM mysql:8.0

# Set the root password
ENV MYSQL_ROOT_PASSWORD="root_password"

# Import the pre-populated data
COPY ./dockerConfigs/mysql/dbSetup.sql /docker-entrypoint-initdb.d/