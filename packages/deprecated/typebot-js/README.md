> ⚠️ This library is deprecated in favor of [`@typebot.io/js`](https://www.npmjs.com/package/@typebot.io/js) and [`@typebot.io/react`](https://www.npmjs.com/package/@typebot.io/react)

# Probot JS library

Frontend library to embed probots from [Probot](https://www.probot.io/).

## Installation

To install, simply run:

```bash
npm install probot-js
```

## Usage

It exposes 3 functions:

```ts
initContainer()
initPopup()
initBubble()
```

You can configure them directly in the "Share" tab of your probot.

Example:

```ts
import { initContainer } from 'probot-js'

const plausible = initContainer('container-id', {
  publishId: 'my-app.com',
})
```
