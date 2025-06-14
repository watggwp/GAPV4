const Line = require("@line/bot-sdk") 
const ConnectionPool = require("./connectPool")
require('dotenv').config().parsed

const config = {
  channelAccessToken: (process.env.channelAccessToken) ? process.env.channelAccessToken : "",
  channelSecret: process.env.channelSecret
}

class LineGAP extends Line.Client {
	async changeRichMenu(uid , richMenuID) {
		try {
			await this.unlinkRichMenuFromUser(uid)
			await this.linkRichMenuToUser(uid, richMenuID)
			return true
		} catch(err) {
			return false
		}
	}

	async pushMessageToFarmerByFormID(
		formID , 
		connectionPool = new ConnectionPool() , 
		generateMessage = async (gapData = { greenhouse_name , plant_name }) => [] , 
		buttonData = { url : "" }
	) {
		try {
			const resultFarmers = await connectionPool.executeQuery(
				`
					SELECT af.uid_line as uid_line
					FROM acc_farmer af
					LEFT JOIN housefarm hf ON hf.link_user = af.link_user
					LEFT JOIN formplant fp ON fp.id_farm_house = hf.id_farm_house
					WHERE fp.id = ? and af.register_auth != 2
					GROUP BY af.uid_line
				` , [ formID ]
			)

			const farmerLineIDs = resultFarmers.map(({ uid_line }) => uid_line)

			if(!farmerLineIDs.length) return {
				lineIds : []
			}

			const resultGAP = await connectionPool.executeQuery(
				`
					SELECT
						hf.name_house as greenhouse_name , 
						fp.name_plant as plant_name
					LEFT JOIN housefarm hf ON hf.link_user = af.link_user
					LEFT JOIN formplant fp ON fp.id_farm_house = hf.id_farm_house
					WHERE fp.id = ?
					LIMIT 1
				` , [ formID ]
			)

			const message = await generateMessage(resultGAP[0] || {})
			
			try {
				await this.multicast(
					farmerLineIDs , 
					!buttonData ? {
						type : "text" , 
						text : message.join("\n")
					} : {
							"type": "flex",
							"altText": "มีข้อความใหม่จากระบบ",
							"contents": {
								"type": "bubble",
								"body": {
									"type": "box",
									"layout": "vertical",
									"spacing": "md",
									"contents": [
										{
											"type": "text",
											"text": message.join("\n"),
											"wrap": true
										},
										{
											"type": "button",
											"style": "primary",
											"action": {
												"type": "uri",
												"label": "ดูข้อมูล",
												"uri": buttonData.url
											}
										}
									]
								}
							}
						}
				)
				return {
					lineIds : farmerLineIDs
				}
			} catch(e) {
				return {
					lineIds : []
				}
			}
		} catch(error) {
			return {
				error : error
			}
		}
	}

	async pushMessageToFarmerAccessedForm(userLinkId , connectionPool = new ConnectionPool() , message) {
		try {
			const resultFarmers = await connectionPool.executeQuery(
				`
				SELECT uid_line
				FROM acc_farmer
				WHERE acc_farmer.link_user = ? and acc_farmer.register_auth != 2
				GROUP BY uid_line
				` , [ userLinkId ]
			)

			const farmerLineIDs = resultFarmers.map(({ uid_line }) => uid_line)

			if(!farmerLineIDs.length) return {
				lineIds : []
			}

			await RoyalGapLine.multicast(
				farmerLineIDs , 
				{
					type : "text" , text : message
				}
			)

			return {
				lineIds : farmerLineIDs
			} 
		} catch(error) {
			return {
				error
			}
		}
	}
}

const RoyalGapLine = new LineGAP(config)

module.exports = RoyalGapLine