export const DOG_BREEDS = [
  '柴犬', '拉布拉多', '金毛', '牧羊犬', '斗牛犬', '罗威纳', 
  '杜宾', '大丹', '萨摩耶', '哈士奇', '藏獒', 
  '柯基', '比格', '贵宾', '博美', '约克夏', '巴哥',
  '西高地', '西施犬', '吉娃娃', '小鹿犬', '雪纳瑞',
  '中华田园犬', '其他狗狗'
];

export const CAT_BREEDS = [
  '缅因猫', '孟加拉豹猫', '苏格兰折耳猫', '布偶猫', 
  '英国短毛猫', '美国短毛猫', '暹罗猫', '俄罗斯蓝猫', 
  '波斯猫', '狸花猫', '橘猫', '无毛猫', '其他猫咪'
];

// Mapping for avatar file names (we will download these)
export const BREED_AVATAR_MAP: Record<string, string> = {
  // Dogs
  '柴犬': 'dog-shiba.jpg',
  '拉布拉多': 'dog-labrador.jpg',
  '金毛': 'dog-golden.jpg',
  '牧羊犬': 'dog-shepherd.jpg',
  '斗牛犬': 'dog-bulldog.jpg',
  '罗威纳': 'dog-rottweiler.jpg',
  '杜宾': 'dog-doberman.jpg',
  '萨摩耶': 'dog-samoyed.jpg',
  '哈士奇': 'dog-husky.jpg',
  '柯基': 'dog-corgi.jpg',
  '比格': 'dog-beagle.jpg',
  '贵宾': 'dog-poodle.jpg',
  '博美': 'dog-pomeranian.jpg',
  '约克夏': 'dog-yorkshire.jpg',
  '巴哥': 'dog-pug.jpg',
  '吉娃娃': 'dog-chihuahua.jpg',
  '雪纳瑞': 'dog-schnauzer.jpg',
  '中华田园犬': 'dog-akita.jpg', // Akita looks similar enough
  
  // Cats
  '英国短毛猫': 'cat-british.jpg',
  '美国短毛猫': 'cat-american.jpg',
  '布偶猫': 'cat-ragdoll.jpg',
  '暹罗猫': 'cat-siamese.jpg',
  '波斯猫': 'cat-persian.jpg',
  '缅因猫': 'cat-mainecoon.jpg',
  '橘猫': 'cat-orange.jpg',
  '狸花猫': 'cat-tabby.jpg',
  '孟加拉豹猫': 'cat-bengal.jpg',
  '俄罗斯蓝猫': 'cat-russian.jpg',
  '无毛猫': 'cat-sphynx.jpg'
};
