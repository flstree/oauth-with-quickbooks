import OAuthClient from 'intuit-oauth';
const baseUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company`;

export const fetchCustomer = async (client: OAuthClient, companyid: string, name: string) => {
    let apiUrl = baseUrl + `/${companyid}/query`;
    let customerResponse = await client.makeApiCall({
        url: apiUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/text', // Set the desired Content-Type
        },
        body: `select * from Customer Where DisplayName = '${name}'`
      }).catch((error) => {
        throw new Error(error?.message)
      });

    return customerResponse?.json?.QueryResponse?.Customer?.[0] || {};
}

export const fetchBudgets = async (client: OAuthClient, companyid: string, maxresults: number = 5) => {
    const apiUrl = baseUrl + `/${companyid}/query`;
    const response = await client.makeApiCall({
        url: apiUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/text', // Set the desired Content-Type
        },
        body: `Select * from Budget startposition 1 maxresults ${maxresults}`
      }).catch((error) => {
        throw new Error(error.originalMessage + ':-> ' + error.error_description)
      });
  
    const budgets = response.getJson()?.QueryResponse;
    return budgets;
}

export const createBudget = async (client: OAuthClient, companyid: string, data: any) => {
    const apiUrl = baseUrl + `/${companyid}/budget`;

    const response = await client.makeApiCall({
        url: apiUrl,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).catch((error) => {
        console.log(error);
        console.log(`${error.originalMessage}: ${error.error_description}`);
      });

      return response;
}

export const createCustomer = async (client: OAuthClient, companyid: string, data: any) => {
    const apiUrl = baseUrl + `/${companyid}/customer`;
    const customerResponse = await client.makeApiCall({
        url: apiUrl,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    return customerResponse?.json?.Customer || {};
}

export const createPayment = async (client: OAuthClient, companyid: string, data: any) => {
    const apiUrl = baseUrl + `/${companyid}/payment`;
    const paymentResponse = await client.makeApiCall({
      url: apiUrl,
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return paymentResponse.getJson();
}