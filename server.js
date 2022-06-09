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
			username: process.env.API_KEY,
			password: process.env.API_SECRET
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
				// console.log(order.customerNotes, order.orderNumber);
				let current_customerNotes = order.customerNotes;
				if ( current_customerNotes ){
					if ( current_customerNotes.indexOf('gift_message') > 0 ) {
						// let giftmessage_position = current_customerNotes.indexOf("gift_message");
						let new_gift_message = current_customerNotes.slice(current_customerNotes.indexOf("gift_message"));
						newShipOrder.customerNotes = new_gift_message;						
					}else{
						newShipOrder.customerNotes = '';
					}
					// await axios.post( process.env.SHIPSTATION_API_URL + '/orders/createorder', newShipOrder, {
					// 	auth: {
					// 		username: process.env.API_KEY,
					// 		password: process.env.API_SECRET
					// 	}
					// });
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
