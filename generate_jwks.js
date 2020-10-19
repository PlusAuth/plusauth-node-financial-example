const fs = require('fs')
const jose = require('jose')

const key = jose.JWK.generateSync("EC", 'P-256', { use: "sig", alg: "ES256"})

const privateKey = key.toJWK(true)
const publicKey = key.toJWK(false)

fs.writeFileSync('es256_private.json', JSON.stringify(privateKey, null, 2));
fs.writeFileSync('es256_public.json', JSON.stringify(publicKey, null, 2));
