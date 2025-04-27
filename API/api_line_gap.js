const Line = require('@line/bot-sdk')
const fs = require("fs");
require('dotenv').config().parsed

const config = {
  channelAccessToken: process.env.channelAccessToken,
  channelSecret: process.env.channelSecret
}
const richmenu = new Line.Client(config)

const RichMenu = {
  createRichLogin : () => {
    const jsonLogin = 
    {
      "size": {
        "width": 2500,
        "height": 843
      },
      "selected": true,
      "name": "signup",
      "chatBarText": "เข้าสู่ระบบ",
      "areas": [
        {
          "bounds": {
            "x": 8,
            "y": 9,
            "width": 1242,
            "height": 819
          },
          "action": {
            "type": "uri",
            "uri": "https://liff.line.me/2006915135-zmE4MLZb"
          }
        },
        {
          "bounds": {
            "x": 1263,
            "y": 4,
            "width": 1229,
            "height": 832
          },
          "action": {
            "type": "uri",
            "uri": "https://liff.line.me/2006915135-4nOZeDn8"
          }
        },
      ]
    }
    
    richmenu.createRichMenu(jsonLogin).then( async (RichID)=>{
      let pathImage = "API/assets/Menu.png"
      await richmenu.setRichMenuImage(RichID , fs.readFileSync(pathImage) , "image/png")
      richmenu.setDefaultRichMenu(RichID)
    })

  },

  createRichAddFarm : (object_create) => {    
    richmenu.createRichMenu(object_create).then((RichID)=>{
      let pathImage = "API/assets/logined-v3.png"
      richmenu.setRichMenuImage(RichID , fs.readFileSync(pathImage) , "image/png")
    })
  },
  setDefault : (RichID) => {
    richmenu.deleteDefaultRichMenu().then(()=>{
      richmenu.setDefaultRichMenu(RichID).then(()=>console.log(`Rich menu ID : ${RichID} is Run`))
    })
  },
  
  DeleteRichMenu : {
    All : () => {
      richmenu.getRichMenuList().then((val) => {
        if (val.length == 0) {
          console.log("No RichMenu")
          return 0
        }
        val.map(item => richmenu.deleteRichMenu(item.richMenuId).then(()=>console.log("Delete All complete")))
      })
    },
    someone : (RichMenuID) => {
      richmenu.deleteRichMenu(RichMenuID).then(()=>console.log("Delete Complete"))
    }
  },

  DeleteFriend : (userId) => {
    richmenu.linkRichMenuToUser(userId)
  } ,

  GetRichMenu : () => {
    richmenu.getRichMenuList().then((list)=>{
      console.log(list)
    })
  }

}
// RichMenu.DeleteRichMenu.someone("richmenu-4b7073c8a0b28725f8f0873183e7222b")
// RichMenu.GetRichMenu()
// RichMenu.createRichLogin()
// const jsonHouse = 
//     {
//       "size": {
//         "width": 2500,
//         "height": 1320
//       },
//       "selected": true,
//       "name": "house",
//       "chatBarText": "โรงเรือน",
//       "areas": [
//         {
//           "bounds": {
//             "x": 25,
//             "y": 34,
//             "width": 984,
//             "height": 789
//           },
//           "action": {
//             "type": "uri",
//             "uri": "https://liff.line.me/2006915135-rpPe4wml"
//           }
//         },
//         {
//           "bounds": {
//             "x": 1026,
//             "y": 25,
//             "width": 967,
//             "height": 794
//           },
//           "action": {
//             "type": "postback",
//             "text": "เลือกโรงเรือน",
//             "data": "house_add"
//           }
//         },
//         {
//           "bounds": {
//             "x": 2019,
//             "y": 17,
//             "width": 456,
//             "height": 802
//           },
//           "action": {
//             "type": "uri",
//             "uri": "https://liff.line.me/2006915135-ANO5DXR8"
//           }
//         }
//       ]
//     }
// RichMenu.createRichAddFarm({
//   "size": {
//     "width": 2500,
//     "height": 1320
//   },
//   "selected": true,
//   "name": "Menu farmer",
//   "chatBarText": "โรงเรือน",
//   "areas": [
//     {
//       "bounds": {
//         "x": 1026,
//         "y": 25,
//         "width": 1449,
//         "height": 440
//       },
//       "action": {
//         "type": "uri",
//         "uri": "https://liff.line.me/2006915135-bL5Werv3"
//       }
//     },
//     {
//       "bounds": {
//         "x": 38,
//         "y": 503,
//         "width": 963,
//         "height": 793
//       },
//       "action": {
//         "type": "uri",
//         "uri": "https://liff.line.me/2006915135-rpPe4wml"
//       }
//     },
//     {
//       "bounds": {
//         "x": 1026,
//         "y": 503,
//         "width": 959,
//         "height": 789
//       },
//       "action": {
//         "type": "postback",
//         "data": "house_add"
//       }
//     },
//     {
//       "bounds": {
//         "x": 2019,
//         "y": 502,
//         "width": 447,
//         "height": 794
//       },
//       "action": {
//         "type": "uri",
//         "uri": "https://liff.line.me/2006915135-ANO5DXR8"
//       }
//     }
//   ]
// })
// RichMenu.setDefault("richmenu-20949fb410f74a6e7f1897a227287a83")
// richmenu.linkRichMenuToUser("U503dd2e67d74458b812b1ad73db59528" , "richmenu-b47b274d02920fb5e8f7600bfa25a936")







// richmenu.getMessageContent("466911495637172372").then((stream)=>{
//   console.log(stream.req)
// }).catch(error=>{
//   console.log({"ERROR" : error})
// })
// RichMenu.DeleteRichMenuAll()
// RichMenu.createRichLogin()
// RichMenu.createRichAddFarm()

// RichMenu.setDefault("richmenu-29008f2338b228f0e50630151d38c29e")

// richmenu.linkRichMenuToUser("Uceb5937bcd2edc0de5341022f8d59e9f" , "richmenu-e27bfb6f25e7ba8daa207df690e18489")

// const createRichLogin = () => {
  // const jsonLogin = 
  // {
  //   "size": {
  //     "width": 2500,
  //     "height": 843
  //   },
  //   "selected": true,
  //   "name": "Login",
  //   "chatBarText": "เข้าสู่ระบบ",
  //   "areas": [
  //     {
  //       "bounds": {
  //         "x": 0,
  //         "y": 0,
  //         "width": 1250,
  //         "height": 843
  //       },
  //       "action": {
  //         "type": "uri",
  //         "uri": "line:https://liff.line.me/1661049098-A9PON7LB"
  //       }
  //     },
  //     {
  //       "bounds": {
  //         "x": 1252,
  //         "y": 0,
  //         "width": 1250,
  //         "height": 843
  //       },
  //       "action": {
  //         "type": "uri",
  //         "uri": "line:https://liff.line.me/1661049098-dorebKYg"
  //       }
  //     }
  //   ]
  // }
  
  // richmenu.createRichMenu(jsonLogin).then((RichID)=>{
  //   let pathImage = "assets/login.png"
  //   richmenu.setRichMenuImage(RichID , fs.readFileSync(pathImage) , "image/png").then(()=>{
  //     richmenu.setDefaultRichMenu(RichID).then(()=>console.log(`Rich menu ID : ${RichID} is Run`))
  //   })
  // })
// }

// const Create = () => {
//   const signinRich = {
//     size: {
//       width: 2500,
//       height: 843
//     },
//     selected: true,
//     name: "หมอช่วยได้",
//     chatBarText: "หมอช่วยได้",
//     areas: [
//       {
//         bounds: {
//           x: 0,
//           y: 0,
//           width: 2500,
//           height: 843
//         },
//         action: {
//           type: "postback",
//           text: "",
//           data: "sign"
//         }
//       }
//     ]
//   }
//   client.createRichMenu(signinRich).then(id => {
//     var image = fs.readFileSync("assets/img/bg.png");
//     client.setRichMenuImage(id, image, "image/png").then(val => {
//       client.setDefaultRichMenu(id);
//     });
//   });
// };

// const GetAll = () => {
//   client.getRichMenuList().then(val => {
//     val.map(item => console.log(item.richMenuId))
//   })
// }

// Delete()


