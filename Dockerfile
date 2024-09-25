FROM node:22-bookworm AS tsc_builder
WORKDIR /app
COPY static/script.ts script.ts
COPY tsconfig.json tsconfig.json
COPY package.json package.json
RUN npm install
RUN npx tsc

FROM python:3.12.6-slim
WORKDIR /app
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
RUN mkdir static
COPY --from=tsc_builder /app/script.js static/script.js
COPY requirements.txt requirements.txt
COPY templates templates
COPY app.py app.py
RUN pip install -r requirements.txt
EXPOSE 50000
CMD ["python", "app.py"]
