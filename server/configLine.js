const Line = require("@line/bot-sdk") 
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
}

const LINE = new LineGAP(config)

module.exports = LINE