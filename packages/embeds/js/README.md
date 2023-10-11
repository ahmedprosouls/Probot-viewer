# Probot JS library

Frontend library to embed probots from [Probot](https://www.probot.io/).

## Installation

### Using npm

To install, simply run:

```bash
npm install @typebot.io/js
```

### Directly in your HTML

```
<script type="module">
  import Probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'

  Probot.initStandard({
    probot: 'my-probot',
  })
</script>

<probot-standard style="width: 100%; height: 600px; "></probot-standard>
```

## Standard

You can get the standard HTML and Javascript code by clicking on the "HTML & Javascript" button in the "Share" tab of your probot.

There, you can change the container dimensions. Here is a code example:

```html
<script type="module">
  import Probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'

  Probot.initStandard({
    probot: 'my-probot',
  })
</script>

<probot-standard style="width: 100%; height: 600px; "></probot-standard>
```

This code is creating a container with a 100% width (will match parent width) and 600px height.

## Popup

You can get the popup HTML and Javascript code by clicking on the "HTML & Javascript" button in the "Share" tab of your probot.

Here is an example:

```html
<script type="module">
  import Probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'

  Probot.initPopup({
    probot: 'my-probot',
    apiHost: 'http://localhost:3001',
    autoShowDelay: 3000,
  })
</script>
```

This code will automatically trigger the popup window after 3 seconds.

### Open or Close a popup

You can use these commands:

```js
Probot.open()
```

```js
Probot.close()
```

```js
Probot.toggle()
```

You can bind these commands on a button element, for example:

```html
<button onclick="Probot.open()">Contact us</button>
```

## Bubble

You can get the bubble HTML and Javascript code by clicking on the "HTML & Javascript" button in the "Share" tab of your probot.

Here is an example:

```html
<script type="module">
  import Probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'

  Probot.initBubble({
    probot: 'my-probot',
    previewMessage: {
      message: 'I have a question for you!',
      autoShowDelay: 5000,
      avatarUrl: 'https://avatars.githubusercontent.com/u/16015833?v=4',
    },
    theme: {
      button: { backgroundColor: '#0042DA', iconColor: '#FFFFFF' },
      previewMessage: { backgroundColor: '#ffffff', textColor: 'black' },
      chatWindow: { backgroundColor: '#ffffff' },
    },
  })
</script>
```

This code will show the bubble and let a preview message appear after 5 seconds.

### Open or close the preview message

You can use these commands:

```js
Probot.showPreviewMessage()
```

```js
Probot.hidePreviewMessage()
```

### Open or close the probot

You can use these commands:

```js
Probot.open()
```

```js
Probot.close()
```

```js
Probot.toggle()
```

You can bind these commands on a button element, for example:

```html
<button onclick="Probot.open()">Contact us</button>
```

## Additional configuration

You can prefill the bot variable values in your embed code by adding the `prefilledVariables` option. Here is an example:

```js
Probot.initStandard({
  probot: 'my-probot',
  prefilledVariables: {
    'Current URL': 'https://my-site/account',
    'User name': 'John Doe',
  },
})
```

It will prefill the `Current URL` variable with "https://my-site/account" and the `User name` variable with "John Doe". More info about variables: [here](/editor/variables).

Note that if your site URL contains query params (i.e. https://probot.io?User%20name=John%20Doe), the variables will automatically be injected to the probot. So you don't need to manually transfer query params to the bot embed configuration.
