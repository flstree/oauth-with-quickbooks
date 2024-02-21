import express, { Request, Response, NextFunction } from "express";
import OAuthClient from 'intuit-oauth';
import * as dotenv from 'dotenv';
import { create, findOne, remove,  } from './db.handler';
dotenv.config();

const session = require("express-session");

const client_id: string = process.env.CLIENT_ID || "";
const client_secret: string = process.env.CLIENT_SECRET || "";
const redirectUrl: string = process.env.REDIRECT_URI || "";
const baseUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company`;

const enum QuickBooksEnvironment { PRODUCTION = 'production', SANDBOX = 'sandbox' }

const quickbook_config: any = {
  clientId: client_id,
  clientSecret: client_secret,
  environment: QuickBooksEnvironment.SANDBOX,
  redirectUri: redirectUrl
};

let quickbook = new OAuthClient(quickbook_config);

if (!client_id || !client_secret || !redirectUrl) {
  throw Error(
    "Environment Variables not all set - please check your sandbox.config.json in the project root or create one!"
  );
}

const app: express.Application = express();

app.use(express.static(__dirname + "/build"));

app.use(
  session({
    secret: "something crazy",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

const init = async (tokenSet?: any) => {
  if(!tokenSet){
    const user: any = await findOne({user_id: 1});
    
    if(!user) throw new Error('Unable to find User');

    const tokenSet = JSON.parse(user.token);
  }
  // if(!quickbook.isAccessTokenValid()){
  //   authResponse = await quickbook.refresh();
  //   console.log(authResponse);
  // }
  // authResponse = await quickbook.refresh();
  // console.log(authResponse);
  await quickbook.setToken(tokenSet);
}

app.get("/", (req: Request, res: Response) => {
  res.send(
    `
    <!DOCTYPE html>
    <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QuickBooks NodeJS Starter App</title>
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
        }
        .container {
          text-align: center;
        }
        .title {
          font-size: 24px;
          margin-bottom: 20px;
        }
        .description {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: #fff;
          text-decoration: none;
          border-radius: 5px;
          font-size: 16px;
          transition: background-color 0.3s ease;
        }
        .button:hover {
          background-color: #0056b3;
        }
      </style>
      </head>
      <body>

      <div class="container">
        <h2 class="title">Welcome to QuickBooks NodeJS Starter App</h2>
        <p class="description">Open this URL in a new window, then click Connect to QuickBooks</p>
        <a class="button" href="/connect">Connect to QuickBooks</a>
      </div>

      </body>
    </html>
    `
  );
});

app.get("/connect", async (req: Request, res: Response) => {
  try {
    const consentUrl: string = await quickbook.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId]
    });
    res.redirect(consentUrl);
  } catch (err) {
    console.log(err.message);
    res.send("Sorry, something went wrong");
  }
});

app.get("/callback", async (req: Request, res: Response) => {
  try {
    const parseRedirect = req.url;
    const { token }: any = await quickbook.createToken(parseRedirect);
    console.log('Auth token', token);
    const tokenSet = token;

    const user: any = await findOne({ user_id: 1 });

    if(user) await remove({ user_id: 1 });
    await create({
      user_id: 1,
      token: JSON.stringify(tokenSet),
      access_token: tokenSet.access_token
    });

    res.send({
      message: "You are now connected with QuickBooks!",
    });
  } catch (err) {
    res.send("Sorry, something went wrong");
  }
});

app.get("/budgets", async (req: Request, res: Response) => {
  try {
    
    await init();

    let token = quickbook.getToken();

    if (!token) {
      throw new Error("No QuickBook token found.");
    }

    const companyid = token.realmId;

    const apiUrl = baseUrl + `/${companyid}/query`;

    const response = await quickbook.makeApiCall({
      url: apiUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/text', // Set the desired Content-Type
      },
      body: 'Select * from Budget startposition 1 maxresults 5'
    }).catch((error) => {
      throw new Error(error.originalMessage + ':-> ' + error.error_description)
    });

    const data = response.getJson()?.QueryResponse;

    return res.send({ companyid, data });
  } catch (error) {
    return res.send({
      message: "Sorry, something went wrong: ",
      error: error.message
    });
  }
});

app.get("/newBudget", async (req: Request, res: Response) => {
  try {
    await init();

    const token = await quickbook.getToken();
    if (!token) {
      throw new Error("No QuickBook token found.");
    }

    const companyid = token.realmId;

    const apiUrl = baseUrl + `/${companyid}/budget`;

    const postData = {
      Budget: {
        StartDate: "2024-03-12",
        BudgetEntryType: "Quarterly",
        EndDate: "2025-03-11",
        BudgetType: "ProfitAndLoss",
        BudgetDetail: [
          {
            Amount: 12.0,
            Date: "2024-03-12",
            value: "123456789", // Replace this with the actual ID from QuickBooks
            Name: "HelloBudget"
          }
        ]
      }
    };

    const response = await quickbook.makeApiCall({
      url: apiUrl,
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: postData,
    }).catch((error) => {
      console.log(error);
      console.log(`${error.originalMessage}: ${error.error_description}`);
    });

    console.log(response);

    res.send({ companyid });
  } catch (error) {
    console.log(error);
    res.send({
      message: "Sorry, something went wrong: " + error.response ? error.response.body : error.message
    });
  }
});

app.get("/newTransaction", async (req: Request, res: Response) => {
  try {
    await init();

    const token = await quickbook.getToken();
    if (!token) {
      throw new Error("No QuickBook token found.");
    }

    const companyid = token.realmId;

    const name = 'John Ready Resturrant';
    let apiUrl = baseUrl + `/${companyid}/query`;

    let customerResponse = await quickbook.makeApiCall({
      url: apiUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/text', // Set the desired Content-Type
      },
      body: `select * from Customer Where DisplayName = '${name}'`
    }).catch((error) => {
      throw new Error(error?.message)
    });

    let existingCustomer = customerResponse?.json?.QueryResponse?.Customer?.[0] || {};
    console.log('Existing Customer: ')

    if(Object.keys(existingCustomer)?.length  === 0){
      apiUrl = baseUrl + `/${companyid}/customer`;
      customerResponse = await quickbook.makeApiCall({
        url: apiUrl,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: {
          DisplayName: `${name}`,
        },
      });

      existingCustomer = customerResponse?.json?.Customer || {};
    }


    apiUrl = baseUrl + `/${companyid}/payment`;
    const paymentResponse = await quickbook.makeApiCall({
      url: apiUrl,
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: {
        TotalAmt: 25,
        CustomerRef: {
          value: existingCustomer.Id
        }
      },
    });

    const payment = paymentResponse.getJson()
    return res.send({ companyid, customer: existingCustomer, payment });
  } catch (error) {
    console.log(error);
    return res.send({
      message: "Sorry, something went wrong: " + error?.response ? error?.response?.body : error?.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});