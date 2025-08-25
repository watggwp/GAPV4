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
      let pathImage = "API/assets/farmer-menuV3-small.png"
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
// RichMenu.DeleteRichMenu.someone("richmenu-307696451cdf4d64368a8476e28e7841")
<<<<<<< HEAD
// RichMenu.GetRichMenu()
=======
RichMenu.GetRichMenu()
>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7
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



// const arr = ['U915317b45fea27966b03ff8e47960321','Ua8b22795d7a7836d34964c41eb7e79f8','Ueb1127b25325ef4c44e790ba5f733972','U7de7081c9429b3810494b67b196b862c','Ua92e362c792ca72b2e2fce43a7786997','U9c9c9a62c127ac538165eaba8baf2c55','Ubc97a05b552c98d1d7a3c095cb57f24d','Uf611da5001eb34b1625d09a32c1881b1','Ud29f09fa731cf161a9217be0226af0fd','Uf053bedbbccd5bf7469c5f0a2cbe6f97','U9dc7e4d3e19d44d0e5aaab17438073ba','Ufadde6f0e899997ca28b7b15696ca4eb','U503dd2e67d74458b812b1ad73db59528','U4cb7823978dc23ae8db37e47fc51ad16','Uf752bef2dca57caefe5a5de4e088ed53','U7ed1d8dd5dfe3f78b05a32920efac403','Ufb3d4a35af0562f74d347e331225b6ad','Uc313adfcf9c82f297837b819e9b4a032','Ucf65620e358a49241e9e662ae4e0db1b']

// arr.forEach(async uid => {
//   try {
//     await richmenu.linkRichMenuToUser(uid , "richmenu-66ad4d7a04211f7350046463aa383ba2")
//   } catch(err) {}
// })



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


