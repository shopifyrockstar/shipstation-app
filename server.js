require('isomorphic-fetch');
const dotenv = require('dotenv');
dotenv.config();
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const express = require('express');
const axios = require('axios');
var router = express.Router();
const bodyParser = require('body-parser');
const app = express();

const {
	SHIPSTATION_API_URL,
	API_KEY,
	API_SECRET
} = process.env;

const getShipDate = ( str, start, end='' ) => {
	var result = str.match( new RegExp( start + "[0-9]{4}([./-])[0-9]{2}[./-][0-9]{2}" + end ) );
	var val = '';
	if ( result && result[0] ) {
		val = result[0].replace( start, '' );
	}

	return val;
}

app.use(bodyParser.raw({type: 'application/json'}));
app.use(bodyParser.urlencoded({
	extended: true
}));

router.get('/', (req, res) => {
	res.send('Hello World!');
});

router.post('/shipstation_order_updated', async (req, res) => {
	const hookData = req.body.toString();
	
	const objHookData = JSON.parse(hookData);
	
	if ( ! objHookData.resource_url ) {
		res.sendStatus(200);
		return;
	}
	
	const shipStationOrderResult = await axios.get( objHookData.resource_url, {
		auth: {
			username: API_KEY,
			password: API_SECRET
		}
	});

	if ( shipStationOrderResult.status != 200 ) {
		res.sendStatus(200);
		return;
	}

	if ( shipStationOrderResult.data.orders ) {
		for ( const order of shipStationOrderResult.data.orders ) {
			let newShipOrder = order;
			if ( order.customerNotes ) {
				let shipDate = getShipDate( order.customerNotes, 'Ship Date: ' );
				if ( shipDate ) {
					newShipOrder.advancedOptions.customField1 = shipDate;

					await axios.post( SHIPSTATION_API_URL + '/orders/createorder', newShipOrder, {
						auth: {
							username: API_KEY,
							password: API_SECRET
						}
					});
				}
			}			
		}
	}

	res.sendStatus(200);
});

app.use('/', router);

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
