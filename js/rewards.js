// 答題回饋：讚美、鼓勵的話，以及家長自己放進來的圖片。
// 圖片只存在這台裝置瀏覽器的 IndexedDB，不會上傳到任何地方。
(function () {
  const THEMES = [
    {
      id: 'babymonster', name: 'BABYMONSTER', emoji: '🎤', color: '#e2336b',
      praise: ['舞台燈光為你亮起來了 ✨', '這個表現可以直接出道了 🎤', '解題跟 BABYMONSTER 的舞步一樣俐落 💃', '練習真的有用，你又進步了 🎶',
        'Ruka 為你比了一個帥氣的手勢 🎤', 'Pharita 送你一個大大的愛心 💗', 'Asa 說：這題解得跟她的 rap 一樣帥！', 'Ahyeon 的高音為你響起來了 🎶',
        'Rami 為你用力鼓掌：太穩了！👏', 'Rora 笑著說：你是今天的主角 ✨', 'Chiquita 跳起來幫你歡呼 💃'],
      cheer: ['每個舞台背後都是很多次練習，再來一次 💪', '練習生也是一次次練出來的，你可以的 🎤', '錯了才知道哪裡要練，這就是在變強 ✨',
        'Ruka 陪你再想一次，慢慢來 🎤', 'Ahyeon 說：一遍一遍練，就會越來越穩 💪', 'Rami 提醒你：深呼吸，再看一次題目最後在問什麼。',
        'Chiquita 說：最小的成員也是一點一點練起來的，再試一次！', 'Pharita 說：沒關係，下一題我們一起加油 💗']
    },
    {
      id: 'idle', name: 'i-dle', emoji: '🎧', color: '#9b7fd4',
      praise: ['小娟（Soyeon）說：這題你寫得比歌詞還順！', 'Miyeon 為你唱了一段應援 🎶', 'Minnie 對你比了一個讚 👍',
        '雨琦（Yuqi）大喊：太厲害了吧！', '舒華（Shuhua）說：你真正讚！💜', 'i-dle 五個人一起為你歡呼 🎉'],
      cheer: ['小娟說：好作品都是改了很多次才完成的，再試一次 ✍️', 'Miyeon 陪你慢慢來，不急 🎧', 'Minnie 說：差一點點，看一下提示再試！',
        '雨琦說：錯了沒關係，下一題會更好 💪', '舒華說：加油！我們都在幫你應援 💜']
    },
    {
      id: 'pochacco', name: '帕洽狗', emoji: '🐶', color: '#f2b33d',
      praise: ['帕洽狗開心到跑了一大圈 🐶', '給你一個帕洽狗的擊掌 🐾', '帕洽狗幫你灌籃得分 🏀'],
      cheer: ['帕洽狗陪你再想一次，慢慢來 🐶', '差一點點！深呼吸，再看一次題目最後在問什麼 🐾']
    },
    {
      id: 'cinnamoroll', name: '大耳狗', emoji: '☁️', color: '#7fb7e6',
      praise: ['大耳狗開心得飛上天了 ☁️', '像大耳狗一樣，輕輕鬆鬆飛過這一題 ☁️'],
      cheer: ['大耳狗在旁邊陪你，慢慢來 ☁️', '沒關係，錯的題目最值得學，再試一次 ☁️']
    },
    {
      // 球員名字取自 2026 年中信兄弟開季一軍名單
      id: 'baseball', name: '中信兄弟', emoji: '⚾', color: '#f0b400',
      praise: ['全壘打！這球打得又高又遠 ⚾', '漂亮的安打，像宋晟睿一樣穩穩上壘 ⚾', '兄弟象的應援為你響起來了 🐘',
        '曾頌恩一棒把球送出全壘打牆，你也把這題打出去了！', '江坤宇等級的美技守備，漂亮！', '詹子賢一棒打穿外野，答對了！',
        '王威晨的安打跟你的答案一樣漂亮 ⚾', '呂彥青三振對手，這題被你三振了 🔥', '高宇杰穩穩接住這一球，配合得剛剛好！',
        '陳俊秀為你在休息區大聲歡呼 🐘', '許庭綸飛撲接殺！你的反應好快！'],
      cheer: ['好球帶有點難抓，調整一下再揮棒 ⚾', '棒球選手也不是每一棒都安打，下一棒會更好 💪',
        '岳東華說：調整一下揮棒，再來一次！', '黃韋盛在場邊幫你加油：下一球打回來！', '宋晟睿說：看清楚球路（題目）再出手 ⚾',
        '余謙說：投手也要一球一球練，你也可以！', '江坤宇說：失誤沒關係，下一球守好就好 💪']
    }
  ];

  const DB_NAME = 'math-rewards';
  const STORE = 'images';
  let dbPromise = null;

  function openDb() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  function withStore(mode, fn) {
    return openDb().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error);
    }));
  }

  const listImages = () => withStore('readonly', s => s.getAll()).catch(() => []);
  const addImage = (theme, blob) => withStore('readwrite', s => s.add({ theme, blob }));
  const deleteImage = id => withStore('readwrite', s => s.delete(id));

  // 縮到最長邊 600px，避免手機照片佔太多空間
  async function resize(file) {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 600 / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
      return await new Promise(r => canvas.toBlob(b => r(b || file), 'image/webp', 0.85));
    } catch (e) {
      return file;
    }
  }

  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  // 有放圖片就從圖片裡挑，主題跟著圖片走；沒有圖片就隨機挑主題，用表情符號代替
  async function show(slot, correct) {
    const images = await listImages();
    const image = images.length ? rand(images) : null;
    const theme = (image && THEMES.find(t => t.id === image.theme)) || rand(THEMES);

    const box = document.createElement('div');
    box.className = 'feedback ' + (correct ? 'good' : 'try');

    const pic = document.createElement('div');
    pic.className = 'fb-pic';
    if (image) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(image.blob);
      img.alt = theme.name;
      img.onload = () => URL.revokeObjectURL(img.src);
      pic.append(img);
    } else {
      pic.style.background = theme.color;
      pic.textContent = theme.emoji;
    }

    const msg = document.createElement('div');
    msg.className = 'fb-msg';
    const title = document.createElement('strong');
    title.textContent = correct ? '答對了！' : '再試一次！';
    const text = document.createElement('span');
    text.textContent = rand(correct ? theme.praise : theme.cheer);
    msg.append(title, text);

    box.append(pic, msg);
    slot.replaceChildren(box);
  }

  window.Rewards = { THEMES, listImages, addImage, deleteImage, resize, show };
})();
