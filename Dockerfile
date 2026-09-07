FROM node:20

WORKDIR /app

# Instalar dependencias necesarias para Electron y node-pty en Linux
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Exponer el puerto 4050
EXPOSE 4050

# Para correr Electron en Docker sin interfaz gráfica real, usamos xvfb
CMD ["xvfb-run", "-a", "npm", "start"]
