import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('✅ DiagPV HUB - Test OK!')
})

app.get('/modules/electroluminescence', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Test EL</title>
    </head>
    <body>
        <h1>🌙 MODULE ÉLECTROLUMINESCENCE - TEST</h1>
        <p>✅ Test interface basique</p>
        <p>🚀 Service actif avec nouvelles fonctionnalités</p>
    </body>
    </html>
  `)
})

export default app