FROM tomcat:9.0.99-jdk8-temurin-noble

ENV JAVA_OPTS="-Xmx4096m -Xms4096m"

COPY ./hit-base-web/target/pcdtool.war /usr/local/tomcat/webapps/pcdtool.war
COPY ./dockerConfigs/webapp/context.xml /usr/local/tomcat/conf/context.xml
COPY ./dockerConfigs/webapp/server.xml /usr/local/tomcat/conf/server.xml

CMD ["catalina.sh", "run"]