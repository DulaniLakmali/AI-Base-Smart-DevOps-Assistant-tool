/**
 * Manifest & Artifact Generation Studio Service (Chapter 3.4.3 & Chapter 4.2)
 * Synthesizes production-ready Dockerfiles, Kubernetes manifests, and CI/CD workflows.
 */

export class ManifestService {
  static generateStack({ stackName, port = 3000, appName = "my-service" }) {
    const cleanApp = appName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    if (stackName === "react") {
      return {
        stack: "React (Vite)",
        dockerfile: `# Production React SPA Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
        k8sDeployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${cleanApp}
  labels:
    app: ${cleanApp}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${cleanApp}
  template:
    metadata:
      labels:
        app: ${cleanApp}
    spec:
      containers:
      - name: ${cleanApp}
        image: ${cleanApp}:v1.0.0
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "250m"
            memory: "256Mi"`,
        k8sService: `apiVersion: v1
kind: Service
metadata:
  name: ${cleanApp}-svc
spec:
  type: ClusterIP
  selector:
    app: ${cleanApp}
  ports:
  - port: 80
    targetPort: 80`,
        ciWorkflow: `name: Build & Deploy React SPA
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: docker build -t ${cleanApp}:latest .`
      };
    }

    if (stackName === "python") {
      return {
        stack: "Python FastAPI",
        dockerfile: `# Production Python FastAPI Dockerfile
FROM python:3.11-slim AS runner
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

RUN addgroup --system appgroup && adduser --system --group appuser
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE ${port}
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${port}"]`,
        k8sDeployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${cleanApp}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${cleanApp}
  template:
    metadata:
      labels:
        app: ${cleanApp}
    spec:
      containers:
      - name: ${cleanApp}
        image: ${cleanApp}:latest
        ports:
        - containerPort: ${port}
        resources:
          requests:
            cpu: "200m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"`,
        k8sService: `apiVersion: v1
kind: Service
metadata:
  name: ${cleanApp}-svc
spec:
  type: ClusterIP
  selector:
    app: ${cleanApp}
  ports:
  - port: ${port}
    targetPort: ${port}`,
        ciWorkflow: `name: Python CI/CD
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest`
      };
    }

    // Default Node.js Express Microservice
    return {
      stack: "Node.js Express API",
      dockerfile: `# Production Multi-Stage Node.js Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --if-present

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app ./
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE ${port}
CMD ["node", "src/index.js"]`,
      k8sDeployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${cleanApp}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${cleanApp}
  template:
    metadata:
      labels:
        app: ${cleanApp}
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
      containers:
      - name: ${cleanApp}
        image: ${cleanApp}:v1.0.0
        ports:
        - containerPort: ${port}
        resources:
          requests:
            cpu: "150m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        readinessProbe:
          httpGet:
            path: /api/health
            port: ${port}
          initialDelaySeconds: 5
          periodSeconds: 10`,
      k8sService: `apiVersion: v1
kind: Service
metadata:
  name: ${cleanApp}-svc
spec:
  type: ClusterIP
  selector:
    app: ${cleanApp}
  ports:
  - port: ${port}
    targetPort: ${port}`,
      ciWorkflow: `name: Node.js CI/CD Pipeline
on:
  push:
    branches: [ main ]
jobs:
  pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: docker build -t ${cleanApp}:latest .`
    };
  }
}
