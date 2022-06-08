import type { NextPage } from 'next'

import { Button } from '@mantine/core';
import { useOs, OS } from '@mantine/hooks';

const squareClientId = process.env.SQUARE_CLIENT_ID;
const callbackUrl    = process.env.SQUARE_CALLBACK_URL;

const buildIntentLink = (os: OS, amount: Number) => {
  const androidIntent = `intent:#Intent;action=com.squareup.pos.action.CHARGE;package=com.squareup;S.browser_fallback_url=${callbackUrl};S.com.squareup.pos.WEB_CALLBACK_URI=${callbackUrl};S.com.squareup.pos.CLIENT_ID=${squareClientId};S.com.squareup.pos.API_VERSION=v2.0;i.com.squareup.pos.TOTAL_AMOUNT=${amount};S.com.squareup.pos.CURRENCY_CODE=USD;S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD;end`;
  // if (os === 'android')
    return (
      <a href={androidIntent}>
        Start Transaction
      </a>
    );

  const iosData = {
    amount_money: {
      amount       : amount.toString(),
      currency_code: 'USD'
    },

    callback_url: callbackUrl,

    client_id: squareClientId,

    version: '1.3',
    notes: 'notes for the transaction',
    options: {
      supported_tender_types: ['CREDIT_CARD','CASH','OTHER','SQUARE_GIFT_CARD','CARD_ON_FILE']
    }
  };

  const iosUrl = `square-commerce-v1://payment/create?data=${encodeURIComponent(JSON.stringify(iosData))}`;

  console.log(iosUrl);

  return (
    <a href="" onClick={() => window.location.assign(iosUrl) }>
      Start Transaction :)
    </a>
  );
};

const Home: NextPage = () => {
  const os: OS = useOs();

  return (
    <div>
      { buildIntentLink(os, 10) }
    </div>
  )
}

export default Home
