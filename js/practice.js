(function () {
  const id = new URLSearchParams(location.search).get('s') || '2-1';
  const data = window.SECTIONS[id];
  const root = document.getElementById('practice');

  if (!data) {
    root.innerHTML = '<h1>這個單元還在製作中</h1><p><a href="chapters.html">回章節列表</a>，先練習已經完成的單元吧。</p>';
    return;
  }

  document.title = id + ' ' + data.title;

  const storageKey = 'progress-' + id;
  const total = data.groups.reduce((n, g) => n + g.questions.length, 0);
  let solved = loadSolved();

  function loadSolved() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveSolved() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(solved));
    } catch (e) {}
  }

  // {a/b} 顯示成上下排列的分數
  const fmt = s => s.replace(/\{([^{}\/]+)\/([^{}]+)\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>');

  // 全形數字、全形斜線、各種負號統一成半形，方便比對答案
  function normalize(s) {
    return s.trim()
      .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .replace(/／/g, '/')
      .replace(/[−－–—]/g, '-')
      .replace(/[，、]/g, ',');
  }

  function gcd(a, b) {
    return b ? gcd(b, a % b) : Math.abs(a);
  }

  function parseFraction(s) {
    const m = s.replace(/\s+/g, '').match(/^(-?)(\d+)(?:\/(\d+))?$/);
    if (!m) return null;
    const n = Number(m[2]) * (m[1] ? -1 : 1);
    const d = m[3] ? Number(m[3]) : 1;
    return d === 0 ? null : { n, d };
  }

  // 回傳 correct、wrong、invalid（格式不對），或 unsimplified（值對了但沒約分）
  function check(q, raw) {
    if (q.type === 'choice') return raw === q.answer ? 'correct' : 'wrong';

    const s = normalize(raw);
    if (q.type === 'set') {
      const got = s.split(/[,\s]+/).filter(Boolean);
      if (!got.length || got.some(x => !/^-?\d+$/.test(x))) return 'invalid';
      const a = [...new Set(got.map(Number))].sort((x, y) => x - y);
      const b = [...q.answer].sort((x, y) => x - y);
      return a.length === b.length && a.every((v, i) => v === b[i]) ? 'correct' : 'wrong';
    }

    const f = parseFraction(s);
    if (!f || (q.type === 'number' && f.d !== 1)) return 'invalid';
    const ans = parseFraction(String(q.answer));
    if (f.n * ans.d !== ans.n * f.d) return 'wrong';
    if (f.d !== 1 && gcd(f.n, f.d) !== 1) return 'unsimplified';
    return 'correct';
  }

  const placeholders = { number: '輸入數字', fraction: '例如 3/4 或 -2/3', set: '例如 1, 2, 3' };
  const formatHelp = {
    number: '請輸入一個整數，例如 12 或 -3。',
    fraction: '請用「分子/分母」的格式輸入，例如 3/4；整數直接輸入就好。',
    set: '請輸入數字，用逗號隔開，例如 1, 2, 3。'
  };

  const chapterNo = id.split('-')[0];
  root.innerHTML = `
    <p class="crumb"><a href="chapters.html">章節練習</a> › 第 ${chapterNo} 章</p>
    <h1>${id}　${data.title}</h1>
    <p class="lead">${fmt(data.intro)}</p>

    <div class="card highlight">
      <span class="badge">解題前先停 10 秒</span>
      <ol class="ask-list">
        <li>題目最後問的是什麼？真的需要算出整個數嗎？</li>
        <li>有沒有學過的方法可以用？</li>
        <li>能不能先用小數字試試看？</li>
      </ol>
    </div>

    <h2>關鍵建議</h2>
    <div class="card"><ul>${data.tips.map(t => `<li>${fmt(t)}</li>`).join('')}</ul></div>

    <h2>常見陷阱</h2>
    <div class="card"><ul>${data.traps.map(t => `<li>${fmt(t)}</li>`).join('')}</ul></div>

    <h2>練習題</h2>
    <p class="note">建議一天做一組，錯的題目隔兩三天再做一次。答對或答錯都會有回饋圖片，可以到<a href="rewards.html">獎勵設定</a>換成喜歡的圖片。</p>
    <div class="progress" id="score" aria-live="polite"></div>
    <div id="groups"></div>
    <button class="link-btn" id="reset" type="button">清除這個單元的作答紀錄</button>`;

  const scoreEl = document.getElementById('score');

  function updateScore() {
    const done = Object.keys(solved).length;
    scoreEl.classList.toggle('done', done === total);
    scoreEl.textContent = done === total
      ? `全部 ${total} 題都答對了，太厲害了！`
      : `已答對 ${done} / ${total} 題`;
  }

  function renderQuestion(q, i) {
    const el = document.createElement('div');
    el.className = 'card q';
    const answerHtml = q.type === 'choice'
      ? `<div class="choices">${q.options.map((o, k) => `<button type="button" class="choice" data-k="${k}">${fmt(o)}</button>`).join('')}</div>`
      : `<form class="answer-row">
           <input type="text" autocomplete="off" placeholder="${placeholders[q.type]}" aria-label="第 ${i + 1} 題的答案">
           ${q.unit ? `<span>${q.unit}</span>` : ''}
           <button class="btn" type="submit">對答案</button>
         </form>`;

    el.innerHTML = `
      <div class="q-head"><span class="num">${i + 1}</span><div class="q-text">${fmt(q.q)}</div></div>
      ${answerHtml}
      <div class="feedback-slot"></div>
      <div class="q-tools">
        <button type="button" class="link-btn show-hint">看提示</button>
        <button type="button" class="link-btn show-key" hidden>看解答與關鍵</button>
      </div>
      <div class="hint" hidden><strong>提示：</strong>${fmt(q.hint)}</div>
      <div class="key" hidden><strong>關鍵：</strong>${fmt(q.key)}</div>`;

    const $ = sel => el.querySelector(sel);
    let misses = 0;

    function reveal(name) {
      $('.' + name).hidden = false;
      const btn = $('.show-' + name);
      if (btn) btn.hidden = true;
    }

    function markSolved() {
      el.classList.add('solved');
      el.querySelectorAll('input, button.choice, .answer-row button').forEach(b => { b.disabled = true; });
      reveal('key');
      $('.show-hint').hidden = true;
    }

    async function submit(raw, choiceBtn) {
      const slot = $('.feedback-slot');
      const result = check(q, raw);
      if (result === 'invalid') {
        slot.innerHTML = `<p class="note">${formatHelp[q.type]}</p>`;
        return;
      }
      if (result === 'unsimplified') {
        slot.innerHTML = '<p class="note">答案的值對了！再約成最簡分數就完成了。</p>';
        return;
      }

      const correct = result === 'correct';
      await window.Rewards.show(slot, correct);
      if (correct) {
        if (choiceBtn) choiceBtn.classList.add('right');
        solved[i] = true;
        saveSolved();
        markSolved();
        updateScore();
      } else {
        if (choiceBtn) {
          choiceBtn.classList.add('wrong-pick');
          choiceBtn.disabled = true;
        }
        misses++;
        reveal('hint');
        if (misses >= 2) $('.show-key').hidden = false;
      }
    }

    $('.show-hint').addEventListener('click', () => {
      reveal('hint');
      $('.show-key').hidden = false;
    });
    $('.show-key').addEventListener('click', () => reveal('key'));

    const form = $('.answer-row');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        submit(form.querySelector('input').value);
      });
    }
    el.querySelectorAll('.choice').forEach(b => {
      b.addEventListener('click', () => submit(q.options[b.dataset.k], b));
    });

    if (solved[i]) markSolved();
    return el;
  }

  const groupsEl = document.getElementById('groups');
  let qNo = 0;
  data.groups.forEach(g => {
    const h = document.createElement('h3');
    h.className = 'group-title';
    h.textContent = g.name;
    groupsEl.append(h);
    g.questions.forEach(q => groupsEl.append(renderQuestion(q, qNo++)));
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('確定要清除這個單元的作答紀錄嗎？')) return;
    solved = {};
    saveSolved();
    location.reload();
  });

  updateScore();
})();
