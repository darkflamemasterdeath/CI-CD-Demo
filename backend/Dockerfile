FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /build

COPY backend/pom.xml .

COPY backend/src ./src

RUN mvn -B package -DskipTests


FROM  eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY  --from=build /build/target/cicd-demo-backend-1.0.0.jar app.jar

EXPOSE  8080

ENTRYPOINT [ "executable" ]