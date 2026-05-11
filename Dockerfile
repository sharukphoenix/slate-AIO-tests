FROM cypress/included:13.16.0

WORKDIR /e2e

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npx","cypress","run","--config-file","cypressQE.config.js","--spec","cypress/e2e/**/*.cy.js","--browser","chrome"]
