# -------- Stage 1: Build --------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy solution and project file
COPY BackendApi.sln .
COPY BackendApi/*.csproj ./BackendApi/

# Restore dependencies
RUN dotnet restore "BackendApi.sln"

# Copy the entire source
COPY BackendApi/ ./BackendApi/

# Build and publish
WORKDIR /src/BackendApi
RUN dotnet publish -c Release -o /app/publish

# -------- Stage 2: Runtime --------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5004
ENV ASPNETCORE_URLS=http://+:5004

ENTRYPOINT ["dotnet", "BackendApi.dll"]
