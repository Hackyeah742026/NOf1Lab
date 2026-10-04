# Multi-stage build for NOf1Lab API (.NET 9)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS restore
WORKDIR /src

COPY NOf1Lab.sln ./
COPY src/NOf1Lab.Domain/NOf1Lab.Domain.csproj src/NOf1Lab.Domain/
COPY src/NOf1Lab.Application/NOf1Lab.Application.csproj src/NOf1Lab.Application/
COPY src/NOf1Lab.Infrastructure/NOf1Lab.Infrastructure.csproj src/NOf1Lab.Infrastructure/
COPY src/NOf1Lab.Api/NOf1Lab.Api.csproj src/NOf1Lab.Api/

RUN dotnet restore src/NOf1Lab.Api/NOf1Lab.Api.csproj

FROM restore AS build
COPY . .
RUN dotnet build src/NOf1Lab.Api/NOf1Lab.Api.csproj -c Release -o /app/build --no-restore

FROM build AS publish
RUN dotnet publish src/NOf1Lab.Api/NOf1Lab.Api.csproj -c Release -o /app/publish /p:UseAppHost=false --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Root so the mounted /data volume is writable for SQLite (local demo)
USER root

EXPOSE 8080

# curl for Compose healthcheck (aspnet:9.0 has neither curl nor wget)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /data

COPY --from=publish /app/publish .

# Compose sets ASPNETCORE_URLS; hosts like Render inject PORT (fall back to 8080).
CMD ["sh", "-c", "if [ -n \"$ASPNETCORE_URLS\" ]; then exec dotnet NOf1Lab.Api.dll; else ASPNETCORE_HTTP_PORTS=${PORT:-8080} exec dotnet NOf1Lab.Api.dll; fi"]
