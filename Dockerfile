FROM cypress/included:15.0.0
WORKDIR /e2e
COPY package.json package-lock.json ./
RUN npm ci
COPY . .