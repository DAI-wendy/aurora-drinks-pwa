/**
 * 極光特調：商品名稱與圖片固定對照
 * 圖片請放在網站的 picture 資料夾內。
 */
window.PRODUCT_IMAGE_MAP = Object.freeze({
  "紫晶星河葡萄氣泡飲": "./picture/01.png",
  "翡翠麝香青提雪霜奢華特調": "./picture/02.png",
  "鎏金雲頂白桃奶蓋": "./picture/03.png",
  "伯爵金箔海鹽奶霜": "./picture/04.png",
  "龍王藍柑橘冰茶": "./picture/05.png",
  "熔岩草莓香檳冰飲": "./picture/06.png",
  "黑鑽松露可可冰沙": "./picture/07.png",
  "玫瑰珍珠極光歐蕾": "./picture/08.png",
  "櫻花琥珀燕窩奶茶": "./picture/09.png",
  "焦糖火山布蕾拿鐵": "./picture/10.png",
  "月蝕黑曜石荔枝冰茶": "./picture/11.png",
  "黃金鳳凰芒果雲霜": "./picture/12.png",
  "人魚之淚海洋椰奶": "./picture/13.png",
  "火焰紅寶石石榴氣泡飲": "./picture/14.png",
  "銀河棉花糖藍莓歐蕾": "./picture/15.png",
  "女王皇冠莓果紅茶": "./picture/16.png",
  "極地鑽石薄荷冰沙": "./picture/17.png",
  "焦糖太陽蛋布丁奶茶": "./picture/18.png",
  "紫藤花園白葡萄奶霜": "./picture/19.png",
  "帝王榴槤金磚奶昔": "./picture/20.png",
});

/** 依商品名稱取得圖片；找不到時回傳預設圖片或空字串。 */
window.getProductImage = function getProductImage(productName, fallback = '') {
  const normalizedName = String(productName ?? '').replace(/\s+/g, '').trim();

  const exactMatch = window.PRODUCT_IMAGE_MAP[productName];
  if (exactMatch) return exactMatch;

  const matchedName = Object.keys(window.PRODUCT_IMAGE_MAP).find(
    (name) => name.replace(/\s+/g, '') === normalizedName
  );

  return matchedName ? window.PRODUCT_IMAGE_MAP[matchedName] : fallback;
};
