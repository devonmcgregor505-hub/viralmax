FROM node:22
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg && \
    pip3 install yt-dlp youtube-transcript-api faster-whisper --break-system-packages
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
