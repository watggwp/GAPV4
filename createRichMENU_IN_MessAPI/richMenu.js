#!/usr/bin/env node
require('dotenv').config();
const Line = require("@line/bot-sdk");
const fs = require('fs');
const path = require('path');

const config = {
    channelAccessToken: process.env.channelAccessToken,
    channelSecret: process.env.channelSecret
};

const client = new Line.Client(config);

// ==================== CREATE RICH MENU ====================

/**
 * สร้าง Rich Menu สำหรับหน้าสมัคร (RICH_SIGN)
 * แบบ 2 ปุ่ม ขนาด 2500x843 pixels
 */
async function createSignupRichMenu() {
    const richMenu = {
        size: { width: 2500, height: 843 },
        selected: false,
        name: "Signup Menu",
        chatBarText: "เมนู",
        areas: [
            {
                bounds: { x: 0, y: 0, width: 1250, height: 843 },
                action: {
                    type: "uri",
                    label: "สมัครสมาชิก",
                    uri: "https://farmer.mhnk.online/signup"
                }
            },
            {
                bounds: { x: 1250, y: 0, width: 1250, height: 843 },
                action: {
                    type: "uri",
                    label: "ติดต่อเจ้าหน้าที่",
                    uri: "https://line.me/R/ti/p/@your-line-id"
                }
            }
        ]
    };

    try {
        const richMenuId = await client.createRichMenu(richMenu);
        console.log('✅ สร้าง Signup Rich Menu สำเร็จ!');
        console.log('   Rich Menu ID:', richMenuId);
        console.log('   📝 คัดลอกไปใส่ใน .env:');
        console.log(`   RICH_SIGN=${richMenuId}\n`);
        return richMenuId;
    } catch (error) {
        console.error('❌ สร้าง Signup Rich Menu ไม่สำเร็จ:', error.message);
        throw error;
    }
}

/**
 * สร้าง Rich Menu สำหรับหน้าหลัก (RICH_HOUSE)
 * แบบ 4 ปุ่ม ขนาด 2500x1686 pixels
 */
async function createHouseRichMenu() {
    const richMenu = {
        size: { width: 2500, height: 1686 },
        selected: true,
        name: "House Menu",
        chatBarText: "เมนูหลัก",
        areas: [
            {
                bounds: { x: 0, y: 0, width: 833, height: 843 },
                action: {
                    type: "uri",
                    label: "โรงเรือน",
                    uri: "https://farmer.mhnk.online/houses"
                }
            },
            {
                bounds: { x: 833, y: 0, width: 834, height: 843 },
                action: {
                    type: "uri",
                    label: "ฟอร์มปลูก",
                    uri: "https://farmer.mhnk.online/form"
                }
            },
            {
                bounds: { x: 1667, y: 0, width: 833, height: 843 },
                action: {
                    type: "uri",
                    label: "สถานีอากาศ",
                    uri: "https://farmer.mhnk.online/weather-station"
                }
            },
            {
                bounds: { x: 0, y: 843, width: 1250, height: 843 },
                action: {
                    type: "message",
                    label: "ช่วยเหลือ",
                    text: "ต้องการความช่วยเหลือ"
                }
            },
            {
                bounds: { x: 1250, y: 843, width: 1250, height: 843 },
                action: {
                    type: "uri",
                    label: "โปรไฟล์",
                    uri: "https://farmer.mhnk.online/house"
                }
            }
        ]
    };

    try {
        const richMenuId = await client.createRichMenu(richMenu);
        console.log('✅ สร้าง House Rich Menu สำเร็จ!');
        console.log('   Rich Menu ID:', richMenuId);
        console.log('   📝 คัดลอกไปใส่ใน .env:');
        console.log(`   RICH_HOUSE=${richMenuId}\n`);
        return richMenuId;
    } catch (error) {
        console.error('❌ สร้าง House Rich Menu ไม่สำเร็จ:', error.message);
        throw error;
    }
}

/**
 * ลบ Rich Menu
 */
async function deleteRichMenu(richMenuId) {
    try {
        await client.deleteRichMenu(richMenuId);
        console.log(`✅ ลบ Rich Menu สำเร็จ: ${richMenuId}`);
    } catch (error) {
        console.error('❌ ลบ Rich Menu ไม่สำเร็จ:', error.message);
        throw error;
    }
}

// ==================== GET RICH MENU ====================

/**
 * ดึงรายการ Rich Menu ทั้งหมด
 */
async function getRichMenuList() {
    try {
        console.log('🔍 กำลังดึงรายการ Rich Menu...\n');

        const richMenuList = await client.getRichMenuList();

        if (richMenuList.length === 0) {
            console.log('❌ ไม่พบ Rich Menu ในบัญชี LINE ของคุณ\n');
            return [];
        }

        console.log(`✅ พบ Rich Menu ทั้งหมด ${richMenuList.length} รายการ:\n`);
        console.log('='.repeat(80));

        richMenuList.forEach((menu, index) => {
            console.log(`\n📋 Rich Menu #${index + 1}`);
            console.log(`   ID:           ${menu.richMenuId}`);
            console.log(`   Name:         ${menu.name}`);
            console.log(`   Chat Bar:     ${menu.chatBarText}`);
            console.log(`   Size:         ${menu.size.width}x${menu.size.height}`);
            console.log(`   Selected:     ${menu.selected}`);
            console.log(`   Areas:        ${menu.areas.length} areas`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('\n📝 คัดลอก Rich Menu IDs ด้านล่างไปใส่ใน .env:\n');

        richMenuList.forEach((menu) => {
            const suggestedName = menu.name.toLowerCase().includes('sign') ? 'RICH_SIGN' :
                menu.name.toLowerCase().includes('house') ? 'RICH_HOUSE' :
                    `RICH_MENU`;
            console.log(`${suggestedName}=${menu.richMenuId}`);
        });

        console.log('\n');
        return richMenuList;
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        throw error;
    }
}

// ==================== UPLOAD IMAGE ====================

/**
 * อัพโหลดรูปภาพ Rich Menu
 */
async function uploadRichMenuImage(richMenuId, imagePath) {
    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error(`ไม่พบไฟล์รูปภาพ: ${imagePath}`);
        }

        const imageBuffer = fs.readFileSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase();

        let contentType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') {
            contentType = 'image/jpeg';
        }

        console.log(`📤 กำลังอัพโหลดรูปภาพ...`);
        console.log(`   Rich Menu ID: ${richMenuId}`);
        console.log(`   Image: ${imagePath}`);
        console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`   Type: ${contentType}\n`);

        await client.setRichMenuImage(richMenuId, imageBuffer, contentType);

        console.log('✅ อัพโหลดรูปภาพสำเร็จ!\n');
        return true;
    } catch (error) {
        console.error('❌ อัพโหลดรูปภาพไม่สำเร็จ:', error.message);
        throw error;
    }
}

// ==================== LINK RICH MENU ====================

/**
 * Link Rich Menu กับ User
 */
async function linkRichMenuToUser(userId, richMenuId) {
    try {
        console.log(`🔗 กำลัง link Rich Menu...`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Rich Menu ID: ${richMenuId}\n`);

        await client.linkRichMenuToUser(userId, richMenuId);

        console.log('✅ Link Rich Menu สำเร็จ!\n');
        return true;
    } catch (error) {
        console.error('❌ Link Rich Menu ไม่สำเร็จ:', error.message);
        throw error;
    }
}

/**
 * Unlink Rich Menu จาก User
 */
async function unlinkRichMenuFromUser(userId) {
    try {
        console.log(`🔓 กำลัง unlink Rich Menu...`);
        console.log(`   User ID: ${userId}\n`);

        await client.unlinkRichMenuFromUser(userId);

        console.log('✅ Unlink Rich Menu สำเร็จ!\n');
        return true;
    } catch (error) {
        console.error('❌ Unlink Rich Menu ไม่สำเร็จ:', error.message);
        throw error;
    }
}

/**
 * ตั้ง Rich Menu เป็น default
 */
async function setDefaultRichMenu(richMenuId) {
    try {
        console.log(`⚙️  กำลังตั้ง Rich Menu เป็น default...`);
        console.log(`   Rich Menu ID: ${richMenuId}\n`);

        await client.setDefaultRichMenu(richMenuId);

        console.log('✅ ตั้งเป็น default Rich Menu สำเร็จ!\n');
        return true;
    } catch (error) {
        console.error('❌ ตั้ง default Rich Menu ไม่สำเร็จ:', error.message);
        throw error;
    }
}

// ==================== MAIN ====================

async function main() {
    console.log('🚀 LINE Rich Menu Manager\n');
    console.log('='.repeat(80));

    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            // CREATE
            case 'create-signup':
                await createSignupRichMenu();
                break;

            case 'create-house':
                await createHouseRichMenu();
                break;

            case 'create-all':
                console.log('📋 กำลังสร้าง Rich Menu ทั้งหมด...\n');
                await createSignupRichMenu();
                await createHouseRichMenu();
                console.log('='.repeat(80));
                console.log('✅ สร้าง Rich Menu ทั้งหมดเสร็จสิ้น!');
                break;

            // DELETE
            case 'delete':
                const richMenuId = args[1];
                if (!richMenuId) {
                    console.error('❌ กรุณาระบุ Rich Menu ID');
                    process.exit(1);
                }
                await deleteRichMenu(richMenuId);
                break;

            // LIST
            case 'list':
                await getRichMenuList();
                break;

            // UPLOAD
            case 'upload':
                const uploadId = args[1];
                const imagePath = args[2];
                if (!uploadId || !imagePath) {
                    console.error('❌ กรุณาระบุ Rich Menu ID และ path รูปภาพ');
                    process.exit(1);
                }
                await uploadRichMenuImage(uploadId, imagePath);
                break;

            // LINK
            case 'link':
                const userId = args[1];
                const linkId = args[2];
                if (!userId || !linkId) {
                    console.error('❌ กรุณาระบุ User ID และ Rich Menu ID');
                    process.exit(1);
                }
                await linkRichMenuToUser(userId, linkId);
                break;

            // UNLINK
            case 'unlink':
                const unlinkUserId = args[1];
                if (!unlinkUserId) {
                    console.error('❌ กรุณาระบุ User ID');
                    process.exit(1);
                }
                await unlinkRichMenuFromUser(unlinkUserId);
                break;

            // SET DEFAULT
            case 'set-default':
                const defaultId = args[1];
                if (!defaultId) {
                    console.error('❌ กรุณาระบุ Rich Menu ID');
                    process.exit(1);
                }
                await setDefaultRichMenu(defaultId);
                break;

            default:
                console.log('📖 วิธีใช้งาน:\n');
                console.log('  สร้าง Rich Menu:');
                console.log('    node richMenu.js create-signup');
                console.log('    node richMenu.js create-house');
                console.log('    node richMenu.js create-all\n');
                console.log('  จัดการ Rich Menu:');
                console.log('    node richMenu.js list');
                console.log('    node richMenu.js delete <RICH_MENU_ID>\n');
                console.log('  อัพโหลดรูปภาพ:');
                console.log('    node richMenu.js upload <RICH_MENU_ID> <IMAGE_PATH>\n');
                console.log('  Link กับ User:');
                console.log('    node richMenu.js link <USER_ID> <RICH_MENU_ID>');
                console.log('    node richMenu.js unlink <USER_ID>');
                console.log('    node richMenu.js set-default <RICH_MENU_ID>\n');
                console.log('='.repeat(80));
        }
    } catch (error) {
        console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
        if (error.statusCode === 401) {
            console.error('🔑 Channel Access Token ไม่ถูกต้อง กรุณาตรวจสอบ .env');
        }
        process.exit(1);
    }
}

// Export functions
module.exports = {
    createSignupRichMenu,
    createHouseRichMenu,
    deleteRichMenu,
    getRichMenuList,
    uploadRichMenuImage,
    linkRichMenuToUser,
    unlinkRichMenuFromUser,
    setDefaultRichMenu
};

// Run if called directly
if (require.main === module) {
    main();
}
