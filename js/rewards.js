// 答題回饋：讚美、鼓勵的話，以及家長自己放進來的圖片。
// 圖片只存在這台裝置瀏覽器的 IndexedDB，不會上傳到任何地方。
(function () {
  const THEMES = [
    {
      id: 'babymonster', name: 'BABYMONSTER', emoji: '🎤', color: '#e2336b',
      praise: ['舞台燈光為你亮起來了 ✨', '這個表現可以直接出道了 🎤', '解題跟 BABYMONSTER 的舞步一樣俐落 💃'],
      cheer: ['每個舞台背後都是很多次練習，再來一次 💪', '練習生也是一次次練出來的，你可以的 🎤']
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
      id: 'baseball', name: '宋承叡', emoji: '⚾', color: '#f0b400',
      praise: ['全壘打！這球打得又高又遠 ⚾', '漂亮的安打，像宋承叡一樣穩穩上壘 ⚾', '兄弟象的應援為你響起來了 🐘'],
      cheer: ['好球帶有點難抓，調整一下再揮棒 ⚾', '棒球選手也不是每一棒都安打，下一棒會更好 💪']
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
