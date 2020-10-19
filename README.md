# PlusAuth NodeJS Starter Project

This is a very simple Node.js project demonstrating how wto use PlusAuth financial clients in a FAPI conformant way.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [License](#license)

## Prerequisites
Before running the project, you must first follow these steps:

1) Create a PlusAuth account and a tenant at [https://dashboard.plusauth.com](https://dashboard.plusauth.com)
2) Generate JWKS with running `npm install && node generate_jwks.js`
2) Navigate to `Clients` tab and create a client of type `Fintech Service`.
4) On the JWKS section copy contents of `es256_public.json` which is generated at the second step.
3) After saving the client, go to details page of it and set the following fields as:
- **Redirect Uris:** http://localhost:3000/auth/callback
- **Post Logout Redirect Uris:** http://localhost:3000/auth/logout/callback


Finally, write down your Client ID for server configuration.
 
## Getting Started

First install dependencies 
```shell script
$ npm install
# or with yarn
$ yarn install
```

After that all you need to do is configuring the application. Rename `.env.example` file as just`.env`.

Then configure the `.env` file using your Client ID and your PlusAuth issuer url.


Now you can start the server:

```shell script
$ npm run start
// or with yarn
$ yarn start
```

The example will be running at [http://localhost:3000/](http://localhost:3000/)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
